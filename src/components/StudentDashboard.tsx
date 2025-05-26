
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar } from 'lucide-react';
import { database } from '@/config/firebase';
import { ref, onValue, off } from 'firebase/database';

interface Subject {
  name: string;
  code: string;
  color: string;
}

interface ScheduleSlot {
  timeSlot: string;
  subjectId: string | null;
}

interface ClassAttendanceRecord {
  status: 'present' | 'absent' | 'late';
  timeIn?: string;
  timeOut?: string;
  subject: string;
  timeSlot: string;
  recordedAt: number;
}

interface DayAttendanceRecord {
  [classKey: string]: ClassAttendanceRecord;
}

const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [attendanceData, setAttendanceData] = useState<Record<string, DayAttendanceRecord>>({});
  const [scheduleData, setScheduleData] = useState<{
    subjects: Record<string, Subject>;
    timeSlots: Record<string, ScheduleSlot[]>;
  }>({ subjects: {}, timeSlots: {} });

  // Load attendance data from Firebase
  useEffect(() => {
    if (!user?.id) {
      console.log('❌ No user ID available for loading attendance data');
      return;
    }

    console.log('🔍 Loading attendance data for student:', user.id);
    
    const attendanceRef = ref(database, `attendanceRecords/${user.id}`);
    
    const unsubscribe = onValue(attendanceRef, (snapshot) => {
      const data = snapshot.val();
      console.log('📊 Raw attendance data from Firebase:', data);
      
      if (data) {
        setAttendanceData(data);
        console.log('✅ Processed attendance data set:', data);
        console.log('📈 Number of attendance days:', Object.keys(data).length);
      } else {
        console.log('📭 No attendance data found for student:', user.id);
        setAttendanceData({});
      }
    }, (error) => {
      console.error('❌ Error loading attendance data:', error);
    });

    return () => {
      off(attendanceRef);
      unsubscribe();
    };
  }, [user?.id]);

  // Load schedule data from Firebase
  useEffect(() => {
    if (!user?.id) {
      console.log('❌ No user ID available for loading schedule data');
      return;
    }

    console.log('🔍 Loading schedule data for student:', user.id);
    
    const scheduleRef = ref(database, `schedules/${user.id}`);
    
    const unsubscribe = onValue(scheduleRef, (snapshot) => {
      const data = snapshot.val();
      console.log('📅 Raw schedule data from Firebase:', data);
      
      if (data) {
        const subjects = data.subjects || {};
        const timeSlots: Record<string, ScheduleSlot[]> = {};
        
        // Convert Firebase schedule format to our component format
        Object.keys(data).forEach(key => {
          if (key !== 'subjects' && data[key]) {
            const daySchedule: ScheduleSlot[] = [];
            
            // Handle indexed structure from Firebase
            Object.values(data[key]).forEach((slot: any) => {
              if (slot && slot.timeSlot) {
                daySchedule.push({
                  timeSlot: slot.timeSlot,
                  subjectId: slot.subjectId
                });
              }
            });
            
            // Sort by time slot
            daySchedule.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
            timeSlots[key] = daySchedule;
          }
        });
        
        setScheduleData({ subjects, timeSlots });
        console.log('✅ Processed schedule data:', { subjects, timeSlots });
        console.log('📚 Number of subjects:', Object.keys(subjects).length);
        console.log('📆 Schedule days:', Object.keys(timeSlots));
      } else {
        console.log('📭 No schedule data found for student:', user.id);
        setScheduleData({ subjects: {}, timeSlots: {} });
      }
    }, (error) => {
      console.error('❌ Error loading schedule data:', error);
    });

    return () => {
      off(scheduleRef);
      unsubscribe();
    };
  }, [user?.id]);

  const getStatusBadge = (status: string) => {
    if (!status) return null;
    
    const variants: Record<string, string> = {
      present: 'bg-green-500 text-white',
      absent: 'bg-red text-white',
      late: 'bg-yellow-500 text-white'
    };
    
    return (
      <Badge className={variants[status] || 'bg-gray-500 text-white'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const calculateAttendanceStats = () => {
    console.log('🧮 Calculating attendance stats from data:', attendanceData);
    
    const allRecords: ClassAttendanceRecord[] = [];
    
    // Flatten all attendance records from all dates
    Object.values(attendanceData).forEach(dayRecord => {
      Object.values(dayRecord).forEach(classRecord => {
        allRecords.push(classRecord);
      });
    });
    
    console.log('📊 All attendance records found:', allRecords.length);
    
    const total = allRecords.length;
    const present = allRecords.filter(r => r.status === 'present').length;
    const absent = allRecords.filter(r => r.status === 'absent').length;
    const late = allRecords.filter(r => r.status === 'late').length;
    const presentAndLate = present + late;
    
    const stats = {
      total,
      present: presentAndLate,
      absent,
      late,
      percentage: total > 0 ? Math.round((presentAndLate / total) * 100) : 0
    };
    
    console.log('📈 Calculated stats:', stats);
    return stats;
  };

  const getSubjectForSlot = (subjectId: string | null) => {
    if (!subjectId) return null;
    return scheduleData.subjects[subjectId] || null;
  };

  const stats = calculateAttendanceStats();

  console.log('🎨 StudentDashboard rendering with:', {
    user: user?.name,
    userId: user?.id,
    attendanceDataKeys: Object.keys(attendanceData),
    scheduleSubjects: Object.keys(scheduleData.subjects),
    scheduleTimeSlots: Object.keys(scheduleData.timeSlots),
    stats
  });

  return (
    <div className="min-h-screen bg-gray-light">
      {/* Header */}
      <div className="bg-dark-blue text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">ICCT RFID System</h1>
            <p className="text-gray-light">Student Portal</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-semibold">{user?.name}</p>
              <p className="text-sm text-gray-light">{user?.id}</p>
            </div>
            <Button 
              onClick={logout}
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white hover:text-dark-blue"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Student Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-dark-blue">Student Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-dark">Student ID</p>
                <p className="font-semibold">{user?.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-dark">Course</p>
                <p className="font-semibold">{user?.course}</p>
              </div>
              <div>
                <p className="text-sm text-gray-dark">Year & Section</p>
                <p className="font-semibold">{user?.year} - {user?.section}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Information */}
        <Card className="border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>User ID:</strong> {user?.id || 'Not available'}</p>
              <p><strong>Attendance Records:</strong> {Object.keys(attendanceData).length} days</p>
              <p><strong>Schedule Subjects:</strong> {Object.keys(scheduleData.subjects).length} subjects</p>
              <p><strong>Schedule Days:</strong> {Object.keys(scheduleData.timeSlots).join(', ') || 'None'}</p>
              <p><strong>Firebase Path:</strong> attendanceRecords/{user?.id}</p>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-dark-blue">{stats.percentage}%</p>
                <p className="text-sm text-gray-dark">Attendance Rate</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                <p className="text-sm text-gray-dark">Present Classes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red">{stats.absent}</p>
                <p className="text-sm text-gray-dark">Absent Classes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
                <p className="text-sm text-gray-dark">Late Classes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Attendance and Schedule */}
        <Tabs defaultValue="attendance" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="attendance">Attendance Records</TabsTrigger>
            <TabsTrigger value="schedule">Class Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle className="text-dark-blue flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Recent Attendance ({Object.keys(attendanceData).length} days found)
                </CardTitle>
                <CardDescription>Your attendance records for this period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(attendanceData).length > 0 ? (
                    Object.entries(attendanceData)
                      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                      .map(([date, dayRecord]) => (
                        <div key={date} className="border border-gray-medium rounded-lg p-4">
                          <h4 className="font-semibold text-dark-blue mb-3">
                            {new Date(date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </h4>
                          <div className="space-y-2">
                            {Object.entries(dayRecord).map(([classKey, record]) => (
                              <div key={classKey} className="flex justify-between items-center p-3 bg-gray-light rounded-lg">
                                <div>
                                  <p className="font-medium">{record.subject || 'Unknown Subject'}</p>
                                  <p className="text-sm text-gray-dark">
                                    {record.timeSlot || 'Unknown Time'}
                                    {record.timeIn && ` | Time In: ${record.timeIn}`}
                                    {record.timeOut && ` | Time Out: ${record.timeOut}`}
                                  </p>
                                </div>
                                {getStatusBadge(record.status)}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-lg">No attendance records found</p>
                      <p className="text-gray-400 text-sm mt-2">
                        Your attendance will appear here after you scan your RFID card
                      </p>
                      <p className="text-gray-400 text-sm">
                        Looking for data at: attendanceRecords/{user?.id}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle className="text-dark-blue">Weekly Schedule</CardTitle>
                <CardDescription>Your class schedule for this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.keys(scheduleData.timeSlots).length > 0 ? (
                    Object.entries(scheduleData.timeSlots).map(([day, slots]) => (
                      <div key={day} className="border border-gray-medium rounded-lg p-4">
                        <h3 className="font-semibold text-dark-blue capitalize mb-3">{day}</h3>
                        <div className="space-y-2">
                          {slots.map((slot, index) => {
                            const subject = getSubjectForSlot(slot.subjectId);
                            return (
                              <div 
                                key={index} 
                                className={`p-3 rounded-lg flex items-center justify-between ${
                                  subject ? subject.color : 'bg-gray-100'
                                }`}
                              >
                                <div>
                                  <span className="font-mono font-medium text-sm">{slot.timeSlot}</span>
                                  {subject && (
                                    <div className="mt-1">
                                      <span className="font-semibold">{subject.code}</span>
                                      <span className="text-sm ml-2">{subject.name}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No class schedule found</p>
                      <p className="text-sm text-gray-400 mt-2">Your schedule will appear here once it's set up by an administrator</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentDashboard;
