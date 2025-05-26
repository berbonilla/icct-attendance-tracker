
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
        if (typeof dayRecord === 'object' && dayRecord !== null && 'status' in dayRecord) {
          // Handle both old format (single record) and new format (day with multiple classes)
          if ('timeSlot' in dayRecord) {
            // New format: ClassAttendanceRecord
            allRecords.push(dayRecord as ClassAttendanceRecord);
          } else {
            // Old format: convert to ClassAttendanceRecord format for processing
            allRecords.push({
              status: dayRecord.status,
              timeIn: dayRecord.timeIn,
              timeOut: dayRecord.timeOut,
              subject: dayRecord.subject || 'Unknown',
              timeSlot: '00:00-00:00',
              recordedAt: Date.now()
            } as ClassAttendanceRecord);
          }
        } else if (typeof dayRecord === 'object' && dayRecord !== null) {
          // New format: DayAttendanceRecord with multiple classes
          Object.values(dayRecord).forEach(classRecord => {
            if (typeof classRecord === 'object' && 'status' in classRecord) {
              allRecords.push(classRecord as ClassAttendanceRecord);
            }
          });
        }
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
    <div className="min-h-screen bg-gray-light">
      {/* Header */}
      <div className="bg-dark-blue text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">ICCT RFID System</h1>
            <p className="text-gray-light">
              Admin Dashboard {!isConnected && '(Connecting to Firebase...)'}
            </p>
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
        {/* Connection Status */}
        {!isConnected && (
          <Card className="border-yellow-300 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                <p className="text-yellow-800">Connecting to Firebase database...</p>
              </div>
            </CardContent>
          </Card>
        )}

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
            disabled={!isConnected}
          >
            This Week
          </Button>
          <Button 
            onClick={() => setFilter('month')}
            variant={filter === 'month' ? 'default' : 'outline'}
            className={filter === 'month' ? 'bg-dark-blue text-white' : ''}
            disabled={!isConnected}
          >
            This Month
          </Button>
          <Button 
            onClick={() => setFilter('term')}
            variant={filter === 'term' ? 'default' : 'outline'}
            className={filter === 'term' ? 'bg-dark-blue text-white' : ''}
            disabled={!isConnected}
          >
            This Term
          </Button>
        </div>

        {/* Tabs for different admin functions */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="attendance" disabled={!isConnected}>Attendance Records</TabsTrigger>
            <TabsTrigger value="students" disabled={!isConnected}>Student Management</TabsTrigger>
            <TabsTrigger value="analytics" disabled={!isConnected}>AI Analytics</TabsTrigger>
            <TabsTrigger value="settings" disabled={!isConnected}>Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle className="text-dark-blue">Attendance Overview</CardTitle>
                <CardDescription>
                  Student attendance records for {filter} 
                  {isConnected ? ' (Live from Firebase)' : ' (Connecting...)'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isConnected ? (
                  <div className="text-center py-8">
                    <p className="text-gray-dark text-lg">Connecting to Firebase...</p>
                    <p className="text-gray-500 text-sm mt-2">Please wait while we load the data</p>
                  </div>
                ) : Object.keys(attendanceData).length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-dark text-lg">No attendance records found</p>
                    <p className="text-gray-500 text-sm mt-2">Add students to start tracking attendance</p>
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
                                // Handle both old and new format
                                if (typeof dayRecord === 'object' && dayRecord !== null && 'status' in dayRecord && 'timeSlot' in dayRecord) {
                                  // Single class record (old format or single class day)
                                  const record = dayRecord as ClassAttendanceRecord;
                                  return (
                                    <div key={date} className="bg-gray-light p-2 rounded text-center">
                                      <p className="text-xs text-gray-dark">{new Date(date).toLocaleDateString()}</p>
                                      {getStatusBadge(record.status)}
                                      {record.timeIn && (
                                        <p className="text-xs text-gray-dark mt-1">{record.timeIn}</p>
                                      )}
                                    </div>
                                  );
                                } else if (typeof dayRecord === 'object' && dayRecord !== null) {
                                  // Multiple classes in a day (new format)
                                  const dayClasses = Object.values(dayRecord as DayAttendanceRecord);
                                  if (dayClasses.length === 0) return null;
                                  
                                  // Show summary of the day
                                  const presentCount = dayClasses.filter(c => c.status === 'present').length;
                                  const lateCount = dayClasses.filter(c => c.status === 'late').length;
                                  const absentCount = dayClasses.filter(c => c.status === 'absent').length;
                                  
                                  let overallStatus = 'present';
                                  if (absentCount > 0) overallStatus = 'absent';
                                  else if (lateCount > 0) overallStatus = 'late';
                                  
                                  return (
                                    <div key={date} className="bg-gray-light p-2 rounded text-center">
                                      <p className="text-xs text-gray-dark">{new Date(date).toLocaleDateString()}</p>
                                      {getStatusBadge(overallStatus)}
                                      <p className="text-xs text-gray-dark mt-1">
                                        {dayClasses.length} classes
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-dark-blue">System Settings</CardTitle>
                <CardDescription>
                  Configure system preferences and alerts 
                  {isConnected ? ' (Connected to Firebase)' : ' (Connecting...)'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border border-gray-medium rounded-lg">
                    <h3 className="font-semibold mb-2">Absentee Alerts</h3>
                    <p className="text-sm text-gray-dark mb-3">Configure automatic notifications for student absences</p>
                    <Button 
                      className="bg-dark-blue text-white hover:bg-light-blue"
                      disabled={!isConnected}
                    >
                      Configure Alerts
                    </Button>
                  </div>
                  
                  <div className="p-4 border border-gray-medium rounded-lg">
                    <h3 className="font-semibold mb-2">Database Management</h3>
                    <p className="text-sm text-gray-dark mb-3">Backup and restore attendance data</p>
                    <div className="flex space-x-2">
                      <Button variant="outline" disabled={!isConnected}>Backup Data</Button>
                      <Button variant="outline" disabled={!isConnected}>Restore Data</Button>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-gray-medium rounded-lg">
                    <h3 className="font-semibold mb-2">Firebase Connection</h3>
                    <p className="text-sm text-gray-dark mb-3">
                      Database URL: https://icct-rfid-system-default-rtdb.asia-southeast1.firebasedatabase.app/
                    </p>
                    <Badge variant="outline" className={isConnected ? 'text-green-600' : 'text-red'}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </Badge>
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
