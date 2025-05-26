import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Edit, Trash, Search, Settings, Calendar } from 'lucide-react';
import ScheduleInput from './ScheduleInput';
import { database } from '@/config/firebase';
import { ref, onValue, set, remove, off } from 'firebase/database';

interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
}

interface ScheduleSlot {
  id: string;
  timeSlot: string;
  subjectId: string | null;
}

interface Student {
  name: string;
  rfid: string;
  email: string;
  course: string;
  year: string;
  section: string;
}

interface StudentWithSchedule extends Student {
  schedule?: Record<string, any>;
}

interface StudentManagementProps {
  pendingRFID?: string | null;
  onStudentRegistered?: () => void;
}

const StudentManagement: React.FC<StudentManagementProps> = ({
  pendingRFID,
  onStudentRegistered
}) => {
  const [students, setStudents] = useState<Record<string, Student>>({});
  const [schedules, setSchedules] = useState<Record<string, Record<string, any>>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [editingScheduleStudentId, setEditingScheduleStudentId] = useState<string | null>(null);
  const [newStudentId, setNewStudentId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [formData, setFormData] = useState<Student & { id?: string }>({
    name: '',
    rfid: '',
    email: '',
    course: '',
    year: '',
    section: ''
  });

  useEffect(() => {
    console.log('🔗 StudentManagement: Connecting to Firebase Database');
    
    // Set up real-time listener for the entire database
    const dbRef = ref(database);
    
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const databaseData = snapshot.val();
      
      console.log('🔥 StudentManagement: Firebase data received:', databaseData);
      
      if (databaseData) {
        setIsConnected(true);
        setStudents(databaseData.students || {});
        setSchedules(databaseData.schedules || {});
        
        console.log('Student management data loaded from Firebase:', {
          studentsCount: Object.keys(databaseData.students || {}).length,
          schedulesCount: Object.keys(databaseData.schedules || {}).length
        });
      } else {
        console.log('Firebase database is empty');
        setIsConnected(true);
        setStudents({});
        setSchedules({});
      }
    }, (error) => {
      console.error('❌ StudentManagement: Firebase error:', error);
      setIsConnected(false);
      setStudents({});
      setSchedules({});
    });

    return () => {
      off(dbRef);
      unsubscribe();
    };
  }, []);

  // Auto-open registration dialog if there's a pending RFID
  useEffect(() => {
    if (pendingRFID && !isAddDialogOpen) {
      console.log('Opening registration for pending RFID:', pendingRFID);
      setFormData({
        name: '',
        rfid: pendingRFID,
        email: '',
        course: '',
        year: '',
        section: ''
      });
      setIsAddDialogOpen(true);
    }
  }, [pendingRFID, isAddDialogOpen]);

  const filteredStudents = Object.entries(students).filter(([id, student]) =>
    id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (studentId: string) => {
    const student = students[studentId];
    setFormData({ ...student, id: studentId });
    setSelectedStudent(studentId);
    setIsEditDialogOpen(true);
  };

  const handleAdd = () => {
    setFormData({
      name: '',
      rfid: '',
      email: '',
      course: '',
      year: '',
      section: ''
    });
    setNewStudentId('');
    setIsAddDialogOpen(true);
  };

  const validateForm = (): boolean => {
    console.log('Validating form data:', formData);
    
    if (!formData.name?.trim() || !formData.rfid?.trim() || !formData.email?.trim() || 
        !formData.course?.trim() || !formData.year?.trim() || !formData.section?.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      console.log('Validation failed: missing required fields');
      return false;
    }

    if (!/^[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}$/.test(formData.rfid)) {
      toast({
        title: "Error",
        description: "RFID must be in format XX:XX:XX:XX (e.g., 9B:54:8E:02)",
        variant: "destructive"
      });
      console.log('Validation failed: invalid RFID format');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      console.log('Validation failed: invalid email format');
      return false;
    }

    if (!/^[1-4](st|nd|rd|th) Year$/.test(formData.year)) {
      toast({
        title: "Error",
        description: "Year must be in format '1st Year', '2nd Year', '3rd Year', or '4th Year'",
        variant: "destructive"
      });
      console.log('Validation failed: invalid year format');
      return false;
    }

    if (!/^[A-Z]$/.test(formData.section)) {
      toast({
        title: "Error", 
        description: "Section must be a single letter (A-Z)",
        variant: "destructive"
      });
      console.log('Validation failed: invalid section format');
      return false;
    }

    const existingRFID = Object.entries(students).find(([id, student]) => 
      student.rfid.toLowerCase() === formData.rfid.toLowerCase() && id !== selectedStudent
    );

    if (existingRFID) {
      toast({
        title: "Error",
        description: `RFID ${formData.rfid.toUpperCase()} is already assigned to ${existingRFID[1].name}`,
        variant: "destructive"
      });
      console.log('Validation failed: duplicate RFID');
      return false;
    }

    console.log('Form validation passed');
    return true;
  };

  const deleteScannedRFID = async (rfid: string) => {
    try {
      console.log('Deleting scanned RFID from Firebase:', rfid);
      const scannedIDRef = ref(database, `ScannedIDs/${rfid}`);
      await remove(scannedIDRef);
      console.log('✅ RFID deleted from Firebase ScannedIDs:', rfid);
    } catch (error) {
      console.error('❌ Error deleting scanned RFID from Firebase:', error);
    }
  };

  const generateStudentId = (): string => {
    const currentYear = new Date().getFullYear();
    const existingIds = Object.keys(students);
    let newNumber = 1;
    let newId = '';
    
    do {
      const paddedNumber = newNumber.toString().padStart(6, '0');
      newId = `TA${currentYear}${paddedNumber}`;
      newNumber++;
    } while (existingIds.includes(newId));

    console.log('Generated new student ID:', newId);
    return newId;
  };

  const saveStudentData = async (studentId: string, studentData: Student) => {
    try {
      console.log('Saving student data to Firebase:', { studentId, studentData });
      
      // Ensure data matches Firebase rules exactly
      const validatedData = {
        name: studentData.name.trim(),
        rfid: studentData.rfid.toUpperCase(),
        email: studentData.email.trim(),
        course: studentData.course.trim(),
        year: studentData.year.trim(),
        section: studentData.section.trim()
      };
      
      console.log('Validated student data:', validatedData);
      
      const studentRef = ref(database, `students/${studentId}`);
      await set(studentRef, validatedData);
      
      console.log('✅ Student data saved to Firebase:', studentId);
      return true;
    } catch (error) {
      console.error('❌ Error saving student data to Firebase:', error);
      console.error('Student ID format:', studentId);
      console.error('Student data structure:', studentData);
      return false;
    }
  };

  const saveScheduleToFirebase = async (studentId: string, schedule: Record<string, any>) => {
    try {
      console.log('Saving schedule data to Firebase:', { studentId, schedule });
      
      // Format schedule data to match Firebase rules exactly
      const firebaseSchedule: Record<string, any> = {};
      
      // Save subjects first
      if (schedule.subjects && Object.keys(schedule.subjects).length > 0) {
        firebaseSchedule.subjects = {};
        Object.entries(schedule.subjects).forEach(([subjectId, subject]: [string, any]) => {
          firebaseSchedule.subjects[subjectId] = {
            name: subject.name,
            code: subject.code,
            color: subject.color
          };
        });
      }
      
      // Format time slots for each day
      if (schedule.timeSlots && Object.keys(schedule.timeSlots).length > 0) {
        Object.entries(schedule.timeSlots).forEach(([day, slots]: [string, any]) => {
          if (Array.isArray(slots) && slots.length > 0) {
            // Create indexed structure for Firebase (0, 1, 2, etc.)
            firebaseSchedule[day] = {};
            slots.forEach((slot: any, index: number) => {
              firebaseSchedule[day][index] = {
                timeSlot: slot.timeSlot,
                subjectId: slot.subjectId || null
              };
            });
          }
        });
      }
      
      console.log('Firebase formatted schedule:', firebaseSchedule);
      
      const scheduleRef = ref(database, `schedules/${studentId}`);
      await set(scheduleRef, firebaseSchedule);
      
      console.log('✅ Schedule data saved to Firebase:', studentId);
      return true;
    } catch (error) {
      console.error('❌ Error saving schedule data to Firebase:', error);
      toast({
        title: "Error",
        description: "Failed to save schedule to database",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const studentData: Student = {
      name: formData.name.trim(),
      rfid: formData.rfid.toUpperCase(),
      email: formData.email.trim(),
      course: formData.course.trim(),
      year: formData.year.trim(),
      section: formData.section.trim()
    };

    console.log('Processing save with data:', studentData);

    if (formData.id && selectedStudent) {
      const success = await saveStudentData(selectedStudent, studentData);
      
      if (success) {
        toast({
          title: "Success",
          description: "Student information updated successfully"
        });
        setIsEditDialogOpen(false);
        resetForm();
      } else {
        toast({
          title: "Error",
          description: "Failed to save student information",
          variant: "destructive"
        });
      }
    } else {
      const newId = generateStudentId();
      const success = await saveStudentData(newId, studentData);
      
      if (success) {
        setNewStudentId(newId);
        setIsAddDialogOpen(false);
        
        await deleteScannedRFID(studentData.rfid);
        
        setIsScheduleDialogOpen(true);
        
        toast({
          title: "Student Registered",
          description: `Student ${studentData.name} has been registered with ID: ${newId}. Please set their schedule.`,
          duration: 5000
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to register student",
          variant: "destructive"
        });
      }
    }
  };

  const handleEditSchedule = (studentId: string) => {
    console.log('Opening schedule editor for student:', studentId);
    setEditingScheduleStudentId(studentId);
    setIsScheduleDialogOpen(true);
  };

  const handleScheduleSave = async (schedule: Record<string, any>) => {
    const targetStudentId = editingScheduleStudentId || newStudentId;
    console.log('Processing schedule save for student:', targetStudentId, schedule);
    
    const success = await saveScheduleToFirebase(targetStudentId, schedule);
    
    if (success) {
      if (editingScheduleStudentId) {
        // Editing existing schedule
        toast({
          title: "Success",
          description: "Schedule updated successfully"
        });
      } else if (onStudentRegistered) {
        // New student registration
        onStudentRegistered();
        toast({
          title: "Success",
          description: "Student registration and schedule setup completed successfully"
        });
      }
      
      setIsScheduleDialogOpen(false);
      setEditingScheduleStudentId(null);
      setNewStudentId('');
      resetForm();
    } else {
      toast({
        title: "Error",
        description: "Failed to save schedule data",
        variant: "destructive"
      });
    }
  };

  const getScheduleDialogTitle = () => {
    if (editingScheduleStudentId) {
      const student = students[editingScheduleStudentId];
      return student ? student.name : 'Unknown Student';
    }
    return formData.name;
  };

  const handleDelete = async (studentId: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        const studentRef = ref(database, `students/${studentId}`);
        await remove(studentRef);
        
        const scheduleRef = ref(database, `schedules/${studentId}`);
        await remove(scheduleRef);
        
        console.log('✅ Student deleted from Firebase:', studentId);
        
        toast({
          title: "Success",
          description: "Student deleted successfully"
        });
      } catch (error) {
        console.error('❌ Error deleting student from Firebase:', error);
        toast({
          title: "Error",
          description: "Failed to delete student",
          variant: "destructive"
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      rfid: '',
      email: '',
      course: '',
      year: '',
      section: ''
    });
    setSelectedStudent(null);
    console.log('Form reset');
  };

  const formatRFIDDisplay = (rfid: string) => {
    return rfid.toUpperCase();
  };

  // Add validation checks
  useEffect(() => {
    console.log('Current state validation:');
    console.log('- Students count:', Object.keys(students).length);
    console.log('- Schedules count:', Object.keys(schedules).length);
    console.log('- Pending RFID:', pendingRFID);
    console.log('- Firebase connected:', isConnected);
    console.log('- Auto admin mode active:', !!pendingRFID);
  }, [students, schedules, pendingRFID, isConnected]);

  return (
    <div className="space-y-6">
      {/* Header with Search and Add Button */}
      <Card>
        <CardHeader>
          <CardTitle className="text-dark-blue flex items-center justify-between">
            <span className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Student Management
              {pendingRFID && (
                <Badge className="ml-2 bg-yellow-500 text-white">
                  RFID Registration Mode
                </Badge>
              )}
              {!isConnected && (
                <Badge className="ml-2 bg-red text-white">
                  Firebase Disconnected
                </Badge>
              )}
            </span>
            <Button 
              onClick={handleAdd}
              className="bg-dark-blue hover:bg-light-blue text-white"
              disabled={!isConnected}
            >
              Add Student
            </Button>
          </CardTitle>
          <CardDescription>
            {pendingRFID 
              ? `Ready to register RFID: ${formatRFIDDisplay(pendingRFID)}`
              : isConnected 
                ? "Manage student information and RFID data (Connected to Firebase)"
                : "Connecting to Firebase database..."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-dark" />
            <Input
              placeholder="Search by ID, name, or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
              disabled={!isConnected}
            />
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map(([studentId, student]) => (
          <Card key={studentId} className="border border-gray-medium hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg text-dark-blue">{student.name}</CardTitle>
                  <CardDescription>{studentId}</CardDescription>
                </div>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditSchedule(studentId)}
                    className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
                    disabled={!isConnected}
                    title="Edit Schedule"
                  >
                    <Calendar className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(studentId)}
                    className="text-light-blue border-light-blue hover:bg-light-blue hover:text-white"
                    disabled={!isConnected}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(studentId)}
                    className="text-red border-red hover:bg-red hover:text-white"
                    disabled={!isConnected}
                  >
                    <Trash className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-gray-dark">Course:</p>
                <p className="font-medium">{student.course}</p>
              </div>
              <div>
                <p className="text-sm text-gray-dark">Year & Section:</p>
                <p className="font-medium">{student.year} - {student.section}</p>
              </div>
              <div>
                <p className="text-sm text-gray-dark">RFID:</p>
                <Badge variant="outline" className="font-mono">{formatRFIDDisplay(student.rfid)}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-dark">Email:</p>
                <p className="text-sm">{student.email}</p>
              </div>
              {schedules[studentId] && (
                <div>
                  <p className="text-sm text-gray-dark">Schedule:</p>
                  <Badge className="bg-green-100 text-green-800">Configured</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-dark">
              {!isConnected 
                ? "Connecting to Firebase database..."
                : Object.keys(students).length === 0 
                  ? "No students registered in the system." 
                  : "No students found matching your search criteria."
              }
            </p>
            {isConnected && Object.keys(students).length === 0 && (
              <p className="text-gray-500 text-sm mt-2">Start by scanning an RFID card or adding a student manually</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Student Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open && !pendingRFID) resetForm();
      }}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-dark-blue">
              {pendingRFID ? 'Register New Student with RFID' : 'Add New Student'}
            </DialogTitle>
            <DialogDescription>
              {pendingRFID 
                ? `Registering RFID: ${formatRFIDDisplay(pendingRFID)}`
                : "Register a new student in the system"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Full Name *</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-rfid">RFID Number *</Label>
              <Input
                id="add-rfid"
                value={formData.rfid}
                onChange={(e) => setFormData({ ...formData, rfid: e.target.value.toUpperCase() })}
                placeholder="XX:XX:XX:XX (e.g., 9B:54:8E:02)"
                readOnly={!!pendingRFID}
                className={pendingRFID ? "bg-gray-100" : ""}
              />
              {pendingRFID && (
                <p className="text-sm text-gray-600">RFID pre-filled from scanned card</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-email">Email *</Label>
              <Input
                id="add-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-course">Course *</Label>
              <Input
                id="add-course"
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                placeholder="Enter course"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="add-year">Year *</Label>
                <Input
                  id="add-year"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="1st Year"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-section">Section *</Label>
                <Input
                  id="add-section"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value.toUpperCase() })}
                  placeholder="A"
                  maxLength={1}
                />
              </div>
            </div>
            <div className="flex space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  if (!pendingRFID) resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-dark-blue hover:bg-light-blue text-white"
                disabled={!isConnected}
              >
                {pendingRFID ? 'Register & Set Schedule' : 'Add & Set Schedule'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-dark-blue">Edit Student</DialogTitle>
            <DialogDescription>Update student information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-rfid">RFID Number</Label>
              <Input
                id="edit-rfid"
                value={formData.rfid}
                onChange={(e) => setFormData({ ...formData, rfid: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-course">Course</Label>
              <Input
                id="edit-course"
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="edit-year">Year</Label>
                <Input
                  id="edit-year"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-section">Section</Label>
                <Input
                  id="edit-section"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                />
              </div>
            </div>
            <div className="flex space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-dark-blue hover:bg-light-blue text-white"
                disabled={!isConnected}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Input Dialog */}
      <ScheduleInput
        isOpen={isScheduleDialogOpen}
        onClose={() => {
          setIsScheduleDialogOpen(false);
          setEditingScheduleStudentId(null);
          setNewStudentId('');
          resetForm();
        }}
        onSave={handleScheduleSave}
        studentName={getScheduleDialogTitle()}
        existingSchedule={editingScheduleStudentId ? schedules[editingScheduleStudentId] : undefined}
      />
    </div>
  );
};

export default StudentManagement;
