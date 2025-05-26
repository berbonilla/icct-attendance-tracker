
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar } from 'lucide-react';
import { AttendanceRecord } from '@/types/attendance';
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

const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceRecord>>({});
  const [scheduleData, setScheduleData] = useState<{
    subjects: Record<string, Subject>;
    timeSlots: Record<string, ScheduleSlot[]>;
  }>({ subjects: {}, timeSlots: {} });

  // Load attendance data from Firebase
  useEffect(() => {
    if (!user?.id) return;

    console.log('Loading attendance data for student:', user.id);
    
    const attendanceRef = ref(database, `attendanceRecords/${user.id}`);
    
    const unsubscribe = onValue(attendanceRef, (snapshot) => {
      const data = snapshot.val();
      console.log('Attendance data from Firebase:', data);
      
      if (data) {
        setAttendanceData(data);
        console.log('Processed attendance data:', data);
      } else {
        console.log('No attendance data found');
        setAttendanceData({});
      }
    }, (error) => {
      console.error('Error loading attendance data:', error);
    });

    return () => {
      off(attendanceRef);
      unsubscribe();
    };
  }, [user?.id]);

  // Load schedule data from Firebase
  useEffect(() => {
    if (!user?.id) return;

    console.log('Loading schedule data for student:', user.id);
    
    const scheduleRef = ref(database, `schedules/${user.id}`);
    
    const unsubscribe = onValue(scheduleRef, (snapshot) => {
      const data = snapshot.val();
      console.log('Schedule data from Firebase:', data);
      
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
        console.log('Processed schedule data:', { subjects, timeSlots });
      } else {
        console.log('No schedule data found');
        setScheduleData({ subjects: {}, timeSlots: {} });
      }
    }, (error) => {
      console.error('Error loading schedule data:', error);
    });

    return () => {
      off(scheduleRef);
      unsubscribe();
    };
  }, [user?.id]);

  const getStatusBadge = (status: string) => {
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
    const records = Object.values(attendanceData);
    const total = records.length;
    const present = records.filter(r => r.status === 'present' || r.status === 'late').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    
    return {
      total,
      present,
      absent,
      late,
      percentage: total > 0 ? Math.round((present / total) * 100) : 0
    };
  };

  const getSubjectForSlot = (subjectId: string | null) => {
    if (!subjectId) return null;
    return scheduleData.subjects[subjectId] || null;
  };

  const stats = calculateAttendanceStats();

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
                <p className="text-sm text-gray-dark">Present Days</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red">{stats.absent}</p>
                <p className="text-sm text-gray-dark">Absent Days</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
                <p className="text-sm text-gray-dark">Late Days</p>
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
                  Recent Attendance
                </CardTitle>
                <CardDescription>Your attendance records for this period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(attendanceData).length > 0 ? (
                    Object.entries(attendanceData)
                      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                      .map(([date, record]) => (
                        <div key={date} className="flex justify-between items-center p-3 bg-gray-light rounded-lg">
                          <div>
                            <p className="font-semibold">{new Date(date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}</p>
                            {record.timeIn && (
                              <p className="text-sm text-gray-dark">
                                Time In: {record.timeIn} 
                                {record.timeOut && ` | Time Out: ${record.timeOut}`}
                                {record.subject && ` | Subject: ${record.subject}`}
                              </p>
                            )}
                          </div>
                          {getStatusBadge(record.status)}
                        </div>
                      ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">No attendance records found</p>
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
