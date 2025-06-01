
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AttendanceData } from '@/types/attendance';
import { DummyDataStructure } from '@/types/dummyData';
import StudentManagement from './StudentManagement';
import AttendanceAnalytics from './AttendanceAnalytics';
import SettingsPanel from './SettingsPanel';
import RecentAttendanceCard from './RecentAttendanceCard';

interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  attendanceData: AttendanceData;
  dummyData: DummyDataStructure;
  pendingRFID?: string | null;
  isConnected: boolean;
  onToggleTracking: () => void;
}

const DashboardTabs: React.FC<DashboardTabsProps> = ({
  activeTab,
  onTabChange,
  attendanceData,
  dummyData,
  pendingRFID,
  isConnected,
  onToggleTracking
}) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="attendance">Attendance</TabsTrigger>
        <TabsTrigger value="students">Students</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="attendance" className="space-y-6">
        <RecentAttendanceCard 
          attendanceData={attendanceData}
          students={dummyData.students}
        />
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
          onToggleTracking={onToggleTracking}
        />
      </TabsContent>
    </Tabs>
  );
};

export default DashboardTabs;
