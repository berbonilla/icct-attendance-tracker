
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Edit, Trash, Search, Settings } from 'lucide-react';

interface Student {
  name: string;
  rfid: string;
  email: string;
  course: string;
  year: string;
  section: string;
}

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Record<string, Student>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Student & { id?: string }>({
    name: '',
    rfid: '',
    email: '',
    course: '',
    year: '',
    section: ''
  });

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const dummyData = await import('../data/dummyData.json');
        setStudents(dummyData.students);
      } catch (error) {
        console.error('Error loading students:', error);
      }
    };

    loadStudents();
  }, []);

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
    setIsAddDialogOpen(true);
  };

  const handleSave = () => {
    if (formData.id && selectedStudent) {
      // Edit existing student
      setStudents(prev => ({
        ...prev,
        [selectedStudent]: {
          name: formData.name,
          rfid: formData.rfid,
          email: formData.email,
          course: formData.course,
          year: formData.year,
          section: formData.section
        }
      }));
      toast({
        title: "Success",
        description: "Student information updated successfully"
      });
      setIsEditDialogOpen(false);
    } else {
      // Add new student - generate new ID
      const year = new Date().getFullYear();
      const existingIds = Object.keys(students);
      let newNumber = 1;
      let newId = '';
      
      do {
        const paddedNumber = newNumber.toString().padStart(3, '0');
        newId = `TA${year}00${paddedNumber}`;
        newNumber++;
      } while (existingIds.includes(newId));

      setStudents(prev => ({
        ...prev,
        [newId]: {
          name: formData.name,
          rfid: formData.rfid,
          email: formData.email,
          course: formData.course,
          year: formData.year,
          section: formData.section
        }
      }));
      
      toast({
        title: "Success",
        description: `Student added successfully with ID: ${newId}`
      });
      setIsAddDialogOpen(false);
    }
  };

  const handleDelete = (studentId: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      setStudents(prev => {
        const newStudents = { ...prev };
        delete newStudents[studentId];
        return newStudents;
      });
      toast({
        title: "Success",
        description: "Student deleted successfully"
      });
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
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Add Button */}
      <Card>
        <CardHeader>
          <CardTitle className="text-dark-blue flex items-center justify-between">
            <span className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Student Management
            </span>
            <Button 
              onClick={handleAdd}
              className="bg-dark-blue hover:bg-light-blue text-white"
            >
              Add Student
            </Button>
          </CardTitle>
          <CardDescription>Manage student information and RFID data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-dark" />
            <Input
              placeholder="Search by ID, name, or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
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
                    onClick={() => handleEdit(studentId)}
                    className="text-light-blue border-light-blue hover:bg-light-blue hover:text-white"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(studentId)}
                    className="text-red border-red hover:bg-red hover:text-white"
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
                <Badge variant="outline" className="font-mono">{student.rfid}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-dark">Email:</p>
                <p className="text-sm">{student.email}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-dark">No students found matching your search criteria.</p>
          </CardContent>
        </Card>
      )}

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
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Student Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-dark-blue">Add New Student</DialogTitle>
            <DialogDescription>Register a new student in the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Full Name</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-rfid">RFID Number</Label>
              <Input
                id="add-rfid"
                value={formData.rfid}
                onChange={(e) => setFormData({ ...formData, rfid: e.target.value })}
                placeholder="Enter RFID number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-course">Course</Label>
              <Input
                id="add-course"
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                placeholder="Enter course"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="add-year">Year</Label>
                <Input
                  id="add-year"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="1st Year"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-section">Section</Label>
                <Input
                  id="add-section"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  placeholder="A"
                />
              </div>
            </div>
            <div className="flex space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-dark-blue hover:bg-light-blue text-white"
              >
                Add Student
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentManagement;
