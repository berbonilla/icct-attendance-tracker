
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Settings } from 'lucide-react';

interface AttendanceRecord {
  status: 'present' | 'absent' | 'late';
  timeIn?: string;
  timeOut?: string;
}

const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceRecord>>({});
  const [schedule, setSchedule] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        const dummyData = await import('../data/dummyData.json');
        const studentAttendance = dummyData.attendanceRecords[user.id as keyof typeof dummyData.attendanceRecords];
        const studentSchedule = dummyData.schedules[user.id as keyof typeof dummyData.schedules];
        
        if (studentAttendance) {
          setAttendanceData(studentAttendance);
        }
        if (studentSchedule) {
          setSchedule(studentSchedule);
        }
      } catch (error) {
        console.error('Error loading student data:', error);
      }
    };

    if (user?.id) {
      loadStudentData();
    }
  }, [user]);

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
                  {Object.entries(attendanceData)
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
                              Time In: {record.timeIn} {record.timeOut && `| Time Out: ${record.timeOut}`}
                            </p>
                          )}
                        </div>
                        {getStatusBadge(record.status)}
                      </div>
                    ))}
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
                  {Object.entries(schedule).map(([day, times]) => (
                    <div key={day} className="border border-gray-medium rounded-lg p-4">
                      <h3 className="font-semibold text-dark-blue capitalize mb-2">{day}</h3>
                      <div className="space-y-1">
                        {times.map((time, index) => (
                          <div key={index} className="bg-gray-light p-2 rounded text-sm">
                            {time}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
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
