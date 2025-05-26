import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Calendar, Clock, TrendingUp } from 'lucide-react';
import { AttendanceData, ClassAttendanceRecord, DayAttendanceRecord } from '@/types/attendance';
import { DummyDataStructure, DummyDataStudent } from '@/types/dummyData';
import StudentManagement from './StudentManagement';
import AttendanceAnalytics from './AttendanceAnalytics';
import { toast } from '@/hooks/use-toast';
import { database } from '@/config/firebase';
import { ref, onValue, off } from 'firebase/database';

interface AdminDashboardProps {
  pendingRFID?: string | null;
  onRFIDRegistered?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  pendingRFID, 
  onRFIDRegistered 
}) => {
  const { user, logout } = useAuth();
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
  const [students, setStudents] = useState<Record<string, DummyDataStudent>>({});
  const [filter, setFilter] = useState<'week' | 'month' | 'term'>('week');
  const [activeTab, setActiveTab] = useState('attendance');
  const [isConnected, setIsConnected] = useState(false);

  // Helper function to check if a record is a ClassAttendanceRecord
  const isClassAttendanceRecord = (record: any): record is ClassAttendanceRecord => {
    return record && typeof record === 'object' && 
           'status' in record && 'subject' in record && 
           'timeSlot' in record && 'recordedAt' in record;
  };

  // Helper function to check if a record is a DayAttendanceRecord
  const isDayAttendanceRecord = (record: any): record is DayAttendanceRecord => {
    return record && typeof record === 'object' && 
           !('status' in record) && !('timeSlot' in record);
  };

  // Helper function to extract all class records from any attendance record
  const extractClassRecords = (dayRecord: any): ClassAttendanceRecord[] => {
    if (isClassAttendanceRecord(dayRecord)) {
      // Single class record (old format or single class day)
      return [dayRecord];
    } else if (isDayAttendanceRecord(dayRecord)) {
      // Multiple classes in a day (new format)
      return Object.values(dayRecord).filter(isClassAttendanceRecord);
    } else if (typeof dayRecord === 'object' && dayRecord !== null && 'status' in dayRecord) {
      // Old format: convert to ClassAttendanceRecord for processing
      return [{
        status: dayRecord.status,
        timeIn: dayRecord.timeIn,
        timeOut: dayRecord.timeOut,
        subject: dayRecord.subject || 'Unknown',
        timeSlot: '00:00-00:00',
        recordedAt: Date.now()
      }];
    }
    return [];
  };

  useEffect(() => {
    // If there's a pending RFID, automatically switch to student management
    if (pendingRFID) {
      setActiveTab('students');
      toast({
        title: "RFID Registration",
        description: `Ready to register RFID: ${pendingRFID.toUpperCase().replace(/(.{2})/g, '$1 ').trim()}`,
        duration: 5000
      });
    }
  }, [pendingRFID]);

  useEffect(() => {
    console.log('🔗 AdminDashboard: Connecting to Firebase Database');
    
    // Set up real-time listener for the entire database
    const dbRef = ref(database);
    
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const databaseData = snapshot.val() as DummyDataStructure | null;
      
      console.log('🔥 AdminDashboard: Firebase data received:', databaseData);
      
      if (databaseData) {
        setIsConnected(true);
        setAttendanceData(databaseData.attendanceRecords || {});
        setStudents(databaseData.students || {});
        
        console.log('Admin dashboard data loaded from Firebase:', {
          studentsCount: Object.keys(databaseData.students || {}).length,
          attendanceRecordsCount: Object.keys(databaseData.attendanceRecords || {}).length
        });
      } else {
        console.log('Firebase database is empty');
        setIsConnected(true);
        setAttendanceData({});
        setStudents({});
      }
    }, (error) => {
      console.error('❌ AdminDashboard: Firebase error:', error);
      setIsConnected(false);
      setAttendanceData({});
      setStudents({});
    });

    return () => {
      off(dbRef);
      unsubscribe();
    };
  }, []);

  const calculateStats = () => {
    const allRecords: ClassAttendanceRecord[] = [];
    
    // Extract all class attendance records from the new structure
    Object.values(attendanceData).forEach(studentRecords => {
      Object.values(studentRecords).forEach(dayRecord => {
        allRecords.push(...extractClassRecords(dayRecord));
      });
    });

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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#1E3A72] text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-blue-200">
              {!isConnected && '(Connecting to Firebase...)'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-semibold">Mr. {user?.name}</p>
              <p className="text-sm text-blue-200">{user?.id}</p>
            </div>
            <Button 
              onClick={logout}
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white hover:text-[#1E3A72] rounded-lg px-6"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Connection Status */}
        {!isConnected && (
          <Card className="border-orange-300 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                <p className="text-orange-800">Connecting to Firebase database...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gray-300 border-0">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="w-8 h-8 text-[#1E3A72]" />
                <div>
                  <p className="text-2xl font-bold text-[#1E3A72]">{stats.totalStudents}</p>
                  <p className="text-sm text-gray-700">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-300 border-0">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.presentRate}%</p>
                  <p className="text-sm text-gray-700">Attendance Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-300 border-0">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Calendar className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.absentCount}</p>
                  <p className="text-sm text-gray-700">Absent Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-300 border-0">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold text-orange-600">{stats.lateCount}</p>
                  <p className="text-sm text-gray-700">Late Today</p>
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
            className={filter === 'week' ? 'bg-gray-400 text-white hover:bg-gray-500' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}
            disabled={!isConnected}
          >
            This Week
          </Button>
          <Button 
            onClick={() => setFilter('month')}
            variant={filter === 'month' ? 'default' : 'outline'}
            className={filter === 'month' ? 'bg-gray-400 text-white hover:bg-gray-500' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}
            disabled={!isConnected}
          >
            This Month
          </Button>
          <Button 
            onClick={() => setFilter('term')}
            variant={filter === 'term' ? 'default' : 'outline'}
            className={filter === 'term' ? 'bg-[#1E3A72] text-white hover:bg-[#2B5AA0]' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}
            disabled={!isConnected}
          >
            This Term
          </Button>
        </div>

        {/* Tabs for different admin functions */}
        <Card className="bg-gray-300 border-0">
          <CardContent className="p-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 bg-gray-300">
                <TabsTrigger 
                  value="attendance" 
                  disabled={!isConnected}
                  className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 text-gray-700"
                >
                  Attendance Records
                </TabsTrigger>
                <TabsTrigger 
                  value="students" 
                  disabled={!isConnected}
                  className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 text-gray-700"
                >
                  Student Management
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics" 
                  disabled={!isConnected}
                  className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 text-gray-700"
                >
                  AI Analytics
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  disabled={!isConnected}
                  className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 text-gray-700"
                >
                  Settings
                </TabsTrigger>
              </TabsList>

              <div className="bg-gray-300 p-6 rounded-lg">
                <TabsContent value="attendance">
                  <div>
                    <h2 className="text-xl font-bold text-[#1E3A72] mb-2">Attendance Overview</h2>
                    <p className="text-gray-700 mb-6">
                      Student attendance records for {filter} 
                      {isConnected ? ' (Live from Firebase)' : ' (Connecting...)'}
                    </p>
                    
                    {!isConnected ? (
                      <div className="text-center py-8">
                        <p className="text-gray-700 text-lg">Connecting to Firebase...</p>
                        <p className="text-gray-600 text-sm mt-2">Please wait while we load the data</p>
                      </div>
                    ) : Object.keys(attendanceData).length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-700 text-lg">No attendance records found</p>
                        <p className="text-gray-600 text-sm mt-2">Add students to start tracking attendance</p>
                      </div>
                    ) : (
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
                                  .map(([date, dayRecord]) => {
                                    const classRecords = extractClassRecords(dayRecord);
                                    
                                    if (classRecords.length === 0) return null;
                                    
                                    if (classRecords.length === 1) {
                                      // Single class record
                                      const record = classRecords[0];
                                      return (
                                        <div key={date} className="bg-gray-light p-2 rounded text-center">
                                          <p className="text-xs text-gray-dark">{new Date(date).toLocaleDateString()}</p>
                                          {getStatusBadge(record.status)}
                                          {record.timeIn && (
                                            <p className="text-xs text-gray-dark mt-1">{record.timeIn}</p>
                                          )}
                                        </div>
                                      );
                                    } else {
                                      // Multiple classes in a day
                                      const presentCount = classRecords.filter(c => c.status === 'present').length;
                                      const lateCount = classRecords.filter(c => c.status === 'late').length;
                                      const absentCount = classRecords.filter(c => c.status === 'absent').length;
                                      
                                      let overallStatus = 'present';
                                      if (absentCount > 0) overallStatus = 'absent';
                                      else if (lateCount > 0) overallStatus = 'late';
                                      
                                      return (
                                        <div key={date} className="bg-gray-light p-2 rounded text-center">
                                          <p className="text-xs text-gray-dark">{new Date(date).toLocaleDateString()}</p>
                                          {getStatusBadge(overallStatus)}
                                          <p className="text-xs text-gray-dark mt-1">
                                            {classRecords.length} classes
                                          </p>
                                        </div>
                                      );
                                    }
                                  })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="students">
                  <StudentManagement 
                    pendingRFID={pendingRFID}
                    onStudentRegistered={onRFIDRegistered}
                  />
                </TabsContent>

                <TabsContent value="analytics">
                  <AttendanceAnalytics 
                    attendanceData={attendanceData}
                    students={students}
                  />
                </TabsContent>

                <TabsContent value="settings">
                  <div>
                    <h2 className="text-xl font-bold text-[#1E3A72] mb-2">System Settings</h2>
                    <p className="text-gray-700 mb-6">
                      Configure system preferences and alerts 
                      {isConnected ? ' (Connected to Firebase)' : ' (Connecting...)'}
                    </p>
                    
                    <div className="space-y-4">
                      <div className="p-4 border border-gray-400 rounded-lg bg-gray-200">
                        <h3 className="font-semibold mb-2 text-gray-800">Absentee Alerts</h3>
                        <p className="text-sm text-gray-700 mb-3">Configure automatic notifications for student absences</p>
                        <Button 
                          className="bg-[#1E3A72] text-white hover:bg-[#2B5AA0]"
                          disabled={!isConnected}
                        >
                          Configure Alerts
                        </Button>
                      </div>
                      
                      <div className="p-4 border border-gray-400 rounded-lg bg-gray-200">
                        <h3 className="font-semibold mb-2 text-gray-800">Database Management</h3>
                        <p className="text-sm text-gray-700 mb-3">Backup and restore attendance data</p>
                        <div className="flex space-x-2">
                          <Button variant="outline" disabled={!isConnected} className="border-gray-500 text-gray-700">Backup Data</Button>
                          <Button variant="outline" disabled={!isConnected} className="border-gray-500 text-gray-700">Restore Data</Button>
                        </div>
                      </div>
                      
                      <div className="p-4 border border-gray-400 rounded-lg bg-gray-200">
                        <h3 className="font-semibold mb-2 text-gray-800">Firebase Connection</h3>
                        <p className="text-sm text-gray-700 mb-3">
                          Database URL: https://icct-rfid-system-default-rtdb.asia-southeast1.firebasedatabase.app/
                        </p>
                        <Badge variant="outline" className={isConnected ? 'text-green-600 border-green-600' : 'text-red-600 border-red-600'}>
                          {isConnected ? 'Connected' : 'Disconnected'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Success notification area */}
        <Card className="bg-gray-300 border-0">
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="font-semibold text-[#1E3A72]">Success</h3>
              <p className="text-gray-700">Admin login successful</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
