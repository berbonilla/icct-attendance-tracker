import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar } from 'lucide-react';
import { AttendanceData } from '@/types/attendance';
import { DummyDataStructure } from '@/types/dummyData';
import StudentManagement from './StudentManagement';
import AttendanceAnalytics from './AttendanceAnalytics';
import AttendanceStats from './AttendanceStats';
import SettingsPanel from './SettingsPanel';
import { toast } from '@/hooks/use-toast';
import { database } from '@/config/firebase';
import { ref, onValue, off } from 'firebase/database';

interface AdminDashboardProps {
  pendingRFID?: string | null;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ pendingRFID }) => {
  const { user: currentUser } = useAuth();
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
  const [dummyData, setDummyData] = useState<DummyDataStructure>({
    students: {},
    schedules: {},
    attendanceRecords: {},
    adminUsers: {},
    absenteeAlerts: {}
  });
  const [filter, setFilter] = useState<'week' | 'month' | 'term'>('week');
  const [activeTab, setActiveTab] = useState('attendance');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Load attendance data
    const attendanceRef = ref(database, 'attendanceRecords');
    const attendanceUnsubscribe = onValue(attendanceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setAttendanceData(data);
        setIsConnected(true);
        console.log('📊 Loaded attendance data:', Object.keys(data).length, 'students');
      } else {
        setAttendanceData({});
        console.log('📊 No attendance data found');
      }
    }, (error) => {
      console.error('❌ Error loading attendance data:', error);
      setIsConnected(false);
      toast({
        title: "Connection Error",
        description: "Failed to load attendance data from Firebase",
        variant: "destructive"
      });
    });

    // Load students data
    const studentsRef = ref(database, 'students');
    const studentsUnsubscribe = onValue(studentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDummyData(prev => ({ ...prev, students: data }));
        console.log('👥 Loaded students data:', Object.keys(data).length, 'students');
      }
    });

    // Load schedules data
    const schedulesRef = ref(database, 'schedules');
    const schedulesUnsubscribe = onValue(schedulesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDummyData(prev => ({ ...prev, schedules: data }));
        console.log('📅 Loaded schedules data:', Object.keys(data).length, 'schedules');
      }
    });

    return () => {
      off(attendanceRef);
      off(studentsRef);
      off(schedulesRef);
      attendanceUnsubscribe();
      studentsUnsubscribe();
      schedulesUnsubscribe();
    };
  }, []);

  const handleToggleTracking = () => {
    if (isConnected) {
      toast({
        title: "Tracking Active",
        description: "Absence tracking is running and will send alerts automatically",
        duration: 3000
      });
    } else {
      toast({
        title: "Connection Required",
        description: "Please ensure Firebase connection is active",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  const getRecentAttendance = (limit: number = 10) => {
    const recentRecords: Array<{
      studentId: string;
      studentName: string;
      status: string;
      subject: string;
      timeIn: string;
      date: string;
    }> = [];

    Object.entries(attendanceData).forEach(([studentId, records]) => {
      const student = dummyData.students[studentId];
      if (!student) return;

      Object.entries(records).forEach(([date, dayRecord]) => {
        // Handle both old and new data structures
        if (dayRecord && typeof dayRecord === 'object') {
          if ('status' in dayRecord && typeof dayRecord.status === 'string') {
            // Old format: single record
            recentRecords.push({
              studentId,
              studentName: student.name,
              status: dayRecord.status,
              subject: (dayRecord as any).subject || 'Unknown',
              timeIn: (dayRecord as any).timeIn || 'N/A',
              date
            });
          } else {
            // New format: multiple classes per day
            Object.values(dayRecord).forEach(classRecord => {
              if (classRecord && typeof classRecord === 'object' && 'status' in classRecord && typeof classRecord.status === 'string') {
                recentRecords.push({
                  studentId,
                  studentName: student.name,
                  status: classRecord.status,
                  subject: (classRecord as any).subject || 'Unknown',
                  timeIn: (classRecord as any).timeIn || 'N/A',
                  date
                });
              }
            });
          }
        }
      });
    });

    return recentRecords
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  };

  const getStatusBadge = (status: string) => {
    const variantMap: Record<string, "present" | "absent" | "late"> = {
      present: "present",
      absent: "absent",
      late: "late"
    };
    
    return (
      <Badge variant={variantMap[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const recentAttendance = getRecentAttendance();

  if (!currentUser) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardContent className="text-center py-8">
          <p className="text-gray-600">Please log in to access the admin dashboard.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-light-gray p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-dark-blue">Admin Dashboard</h1>
            <p className="text-gray-dark">Welcome back, {currentUser.email}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={isConnected ? 'default' : 'secondary'} className="px-3 py-1">
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </Badge>
            {pendingRFID && (
              <Badge variant="outline" className="px-3 py-1 border-orange-500 text-orange-700">
                Pending RFID: {pendingRFID}
              </Badge>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <AttendanceStats 
          attendanceData={attendanceData} 
          students={dummyData.students} 
          filter={filter} 
        />

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Attendance Records</CardTitle>
                <CardDescription>Latest student check-ins and attendance status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentAttendance.length > 0 ? (
                    recentAttendance.map((record, index) => (
                      <div key={`${record.studentId}-${record.date}-${index}`} 
                           className="flex items-center justify-between p-3 border border-gray-medium rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex-1">
                          <h4 className="font-medium text-dark-blue">{record.studentName}</h4>
                          <p className="text-sm text-gray-dark">{record.subject}</p>
                          <p className="text-xs text-gray-500">{record.date} at {record.timeIn}</p>
                        </div>
                        <div>
                          {getStatusBadge(record.status)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No attendance records found</p>
                      <p className="text-sm">Records will appear here when students scan their RFID cards</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <StudentManagement
              pendingRFID={pendingRFID}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AttendanceAnalytics 
              attendanceData={attendanceData}
              students={dummyData.students}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SettingsPanel 
              isConnected={isConnected}
              onToggleTracking={handleToggleTracking}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
