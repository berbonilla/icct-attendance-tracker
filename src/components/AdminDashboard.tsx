
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Settings, Search } from 'lucide-react';
import StudentManagement from './StudentManagement';

interface AttendanceData {
  [studentId: string]: {
    [date: string]: {
      status: 'present' | 'absent' | 'late';
      timeIn?: string;
      timeOut?: string;
    }
  }
}

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
  const [students, setStudents] = useState<any>({});
  const [filter, setFilter] = useState<'week' | 'month' | 'term'>('week');

  useEffect(() => {
    const loadData = async () => {
      try {
        const dummyData = await import('../data/dummyData.json');
        setAttendanceData(dummyData.attendanceRecords);
        setStudents(dummyData.students);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  const calculateOverallStats = () => {
    let totalRecords = 0;
    let presentRecords = 0;
    let absentRecords = 0;
    let lateRecords = 0;

    Object.values(attendanceData).forEach(studentRecords => {
      Object.values(studentRecords).forEach(record => {
        totalRecords++;
        if (record.status === 'present') presentRecords++;
        else if (record.status === 'absent') absentRecords++;
        else if (record.status === 'late') lateRecords++;
      });
    });

    return {
      total: totalRecords,
      present: presentRecords,
      absent: absentRecords,
      late: lateRecords,
      attendanceRate: totalRecords > 0 ? Math.round(((presentRecords + lateRecords) / totalRecords) * 100) : 0
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

  const stats = calculateOverallStats();

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
              <p className="text-sm text-gray-light">{user?.role}</p>
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
        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-dark-blue">{stats.attendanceRate}%</p>
                <p className="text-sm text-gray-dark">Overall Attendance</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{stats.present}</p>
                <p className="text-sm text-gray-dark">Present Records</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red">{stats.absent}</p>
                <p className="text-sm text-gray-dark">Absent Records</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">{stats.late}</p>
                <p className="text-sm text-gray-dark">Late Records</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="attendance">Attendance Records</TabsTrigger>
            <TabsTrigger value="students">Student Management</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <div className="space-y-6">
              {/* Filter Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-dark-blue flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Attendance Analytics
                  </CardTitle>
                  <CardDescription>View attendance statistics by different time periods</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 mb-6">
                    <label className="text-sm font-medium text-dark-blue">Filter by:</label>
                    <Select value={filter} onValueChange={(value: 'week' | 'month' | 'term') => setFilter(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="term">This Term</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Student Performance Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(students).map(([studentId, student]) => {
                      const studentRecords = attendanceData[studentId] || {};
                      const recordsArray = Object.values(studentRecords);
                      const presentCount = recordsArray.filter(r => r.status === 'present' || r.status === 'late').length;
                      const totalCount = recordsArray.length;
                      const attendancePercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

                      return (
                        <Card key={studentId} className="border-l-4 border-l-light-blue">
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <h3 className="font-semibold text-dark-blue">{student.name}</h3>
                              <p className="text-sm text-gray-dark">{studentId}</p>
                              <p className="text-sm text-gray-dark">{student.course}</p>
                              <div className="flex justify-between items-center pt-2">
                                <span className="text-sm">Attendance:</span>
                                <Badge 
                                  className={`${attendancePercentage >= 80 ? 'bg-green-500' : 
                                    attendancePercentage >= 60 ? 'bg-yellow-500' : 'bg-red'} text-white`}
                                >
                                  {attendancePercentage}%
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle className="text-dark-blue">All Attendance Records</CardTitle>
                <CardDescription>Complete attendance history for all students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(attendanceData).map(([studentId, records]) => (
                    <Card key={studentId} className="border border-gray-medium">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-dark-blue">
                          {students[studentId]?.name || studentId}
                        </CardTitle>
                        <CardDescription>{studentId} - {students[studentId]?.course}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {Object.entries(records)
                            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                            .map(([date, record]) => (
                              <div key={date} className="flex justify-between items-center p-2 bg-gray-light rounded">
                                <div>
                                  <p className="text-sm font-medium">{new Date(date).toLocaleDateString()}</p>
                                  {record.timeIn && (
                                    <p className="text-xs text-gray-dark">In: {record.timeIn}</p>
                                  )}
                                </div>
                                {getStatusBadge(record.status)}
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students">
            <StudentManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
