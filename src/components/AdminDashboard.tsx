
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { AttendanceData } from '@/types/attendance';
import { DummyDataStructure } from '@/types/dummyData';
import AttendanceStats from './AttendanceStats';
import AdminHeader from './AdminHeader';
import DashboardStatusBar from './DashboardStatusBar';
import DashboardTabs from './DashboardTabs';
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
    <div className="min-h-screen bg-light-gray">
      <AdminHeader />

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <DashboardStatusBar 
          isConnected={isConnected}
          pendingRFID={pendingRFID}
        />

        <AttendanceStats 
          attendanceData={attendanceData} 
          students={dummyData.students} 
          filter={filter} 
        />

        <DashboardTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          attendanceData={attendanceData}
          dummyData={dummyData}
          pendingRFID={pendingRFID}
          isConnected={isConnected}
          onToggleTracking={handleToggleTracking}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
