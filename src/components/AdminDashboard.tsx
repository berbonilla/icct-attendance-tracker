import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Calendar, Clock, TrendingUp } from 'lucide-react';
import { AttendanceData } from '@/types/attendance';
import { DummyDataStructure, DummyDataStudent } from '@/types/dummyData';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
  const [students, setStudents] = useState<Record<string, DummyDataStudent>>({});
  const [filter, setFilter] = useState<'week' | 'month' | 'term'>('week');

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        // Import the dummy data and explicitly type it
        const dummyDataModule = await import('../data/dummyData.json');
        const dummyData = dummyDataModule.default as any; // Use any to bypass initial type checking
        
        console.log('Loading admin data...', dummyData);
        
        // Type assertion with proper conversion for attendance records
        const typedAttendance: AttendanceData = {};
        Object.entries(dummyData.attendanceRecords || {}).forEach(([studentId, records]) => {
          typedAttendance[studentId] = {};
          Object.entries(records as Record<string, any>).forEach(([date, record]) => {
            typedAttendance[studentId][date] = {
              status: record.status as 'present' | 'absent' | 'late',
              timeIn: record.timeIn,
              timeOut: record.timeOut
            };
          });
        });
        
        setAttendanceData(typedAttendance);
        setStudents(dummyData.students || {});
        
        console.log('Admin data loaded successfully');
      } catch (error) {
        console.error('Error loading admin data:', error);
      }
    };

    loadAdminData();
  }, []);

  const calculateStats = () => {
    const allRecords = Object.values(attendanceData).flatMap(studentRecords => Object.values(studentRecords));
    const total = allRecords.length;
    const present = allRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    const absent = allRecords.filter(r => r.status === 'absent').length;
    const late = allRecords.filter(r => r.status === 'late').length;
    
    return {
      totalStudents: Object.keys(students).length,
      totalRecords: total,
      presentRate: total > 0 ? Math.round((present / total) * 100) : 0,
      absentCount: absent,
      lateCount: late
    };
  };

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

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-light">
      {/* Header */}
      <div className="bg-dark-blue text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">ICCT RFID System</h1>
            <p className="text-gray-light">Admin Dashboard</p>
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
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="w-8 h-8 text-dark-blue" />
                <div>
                  <p className="text-2xl font-bold text-dark-blue">{stats.totalStudents}</p>
                  <p className="text-sm text-gray-dark">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.presentRate}%</p>
                  <p className="text-sm text-gray-dark">Attendance Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Calendar className="w-8 h-8 text-red" />
                <div>
                  <p className="text-2xl font-bold text-red">{stats.absentCount}</p>
                  <p className="text-sm text-gray-dark">Absent Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{stats.lateCount}</p>
                  <p className="text-sm text-gray-dark">Late Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-2">
          <Button 
            onClick={() => setFilter('week')}
            variant={filter === 'week' ? 'default' : 'outline'}
            className={filter === 'week' ? 'bg-dark-blue text-white' : ''}
          >
            This Week
          </Button>
          <Button 
            onClick={() => setFilter('month')}
            variant={filter === 'month' ? 'default' : 'outline'}
            className={filter === 'month' ? 'bg-dark-blue text-white' : ''}
          >
            This Month
          </Button>
          <Button 
            onClick={() => setFilter('term')}
            variant={filter === 'term' ? 'default' : 'outline'}
            className={filter === 'term' ? 'bg-dark-blue text-white' : ''}
          >
            This Term
          </Button>
        </div>

        {/* Tabs for different admin functions */}
        <Tabs defaultValue="attendance" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="attendance">Attendance Records</TabsTrigger>
            <TabsTrigger value="students">Student Management</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle className="text-dark-blue">Attendance Overview</CardTitle>
                <CardDescription>Student attendance records for {filter}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(attendanceData).map(([studentId, records]) => {
                    const student = students[studentId];
                    if (!student) return null;
                    
                    return (
                      <div key={studentId} className="border border-gray-medium rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-dark-blue">{student.name}</h3>
                            <p className="text-sm text-gray-dark">
                              {studentId} | {student.course} - {student.year}-{student.section}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                          {Object.entries(records)
                            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                            .slice(0, 7)
                            .map(([date, record]) => (
                              <div key={date} className="bg-gray-light p-2 rounded text-center">
                                <p className="text-xs text-gray-dark">{new Date(date).toLocaleDateString()}</p>
                                {getStatusBadge(record.status)}
                                {record.timeIn && (
                                  <p className="text-xs text-gray-dark mt-1">{record.timeIn}</p>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle className="text-dark-blue">Student Management</CardTitle>
                <CardDescription>Add, edit, or remove student information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(students).map(([studentId, student]) => (
                    <div key={studentId} className="flex justify-between items-center p-4 border border-gray-medium rounded-lg">
                      <div>
                        <h3 className="font-semibold">{student.name}</h3>
                        <p className="text-sm text-gray-dark">
                          {studentId} | {student.course} - {student.year}-{student.section}
                        </p>
                        {student.rfid && (
                          <p className="text-xs text-gray-dark">RFID: {student.rfid}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm" className="text-red border-red hover:bg-red hover:text-white">
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="text-dark-blue">System Settings</CardTitle>
                <CardDescription>Configure system preferences and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border border-gray-medium rounded-lg">
                    <h3 className="font-semibold mb-2">Absentee Alerts</h3>
                    <p className="text-sm text-gray-dark mb-3">Configure automatic notifications for student absences</p>
                    <Button className="bg-dark-blue text-white hover:bg-light-blue">
                      Configure Alerts
                    </Button>
                  </div>
                  
                  <div className="p-4 border border-gray-medium rounded-lg">
                    <h3 className="font-semibold mb-2">Database Management</h3>
                    <p className="text-sm text-gray-dark mb-3">Backup and restore attendance data</p>
                    <div className="flex space-x-2">
                      <Button variant="outline">Backup Data</Button>
                      <Button variant="outline">Restore Data</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
