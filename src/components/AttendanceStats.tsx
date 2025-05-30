
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Clock, TrendingUp } from 'lucide-react';
import { AttendanceData, ClassAttendanceRecord, DayAttendanceRecord } from '@/types/attendance';
import { DummyDataStudent } from '@/types/dummyData';

interface AttendanceStatsProps {
  attendanceData: AttendanceData;
  students: Record<string, DummyDataStudent>;
  filter: 'week' | 'month' | 'term';
}

const AttendanceStats: React.FC<AttendanceStatsProps> = ({ attendanceData, students, filter }) => {
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
      return [dayRecord];
    } else if (isDayAttendanceRecord(dayRecord)) {
      return Object.values(dayRecord).filter(isClassAttendanceRecord);
    } else if (typeof dayRecord === 'object' && dayRecord !== null && 'status' in dayRecord) {
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

  const calculateStats = () => {
    const allClassRecords: ClassAttendanceRecord[] = [];
    const studentCounts = new Set();
    const dailyAttendance: Record<string, number> = {};

    Object.entries(attendanceData).forEach(([studentId, records]) => {
      studentCounts.add(studentId);
      
      Object.entries(records).forEach(([date, dayRecord]) => {
        const classRecords = extractClassRecords(dayRecord);
        allClassRecords.push(...classRecords);
        
        // Count daily attendance
        const presentClasses = classRecords.filter(r => r.status === 'present' || r.status === 'late').length;
        if (presentClasses > 0) {
          dailyAttendance[date] = (dailyAttendance[date] || 0) + 1;
        }
      });
    });

    const totalClasses = allClassRecords.length;
    const presentClasses = allClassRecords.filter(r => r.status === 'present').length;
    const lateClasses = allClassRecords.filter(r => r.status === 'late').length;
    const absentClasses = allClassRecords.filter(r => r.status === 'absent').length;

    const attendanceRate = totalClasses > 0 ? Math.round(((presentClasses + lateClasses) / totalClasses) * 100) : 0;
    const lateRate = totalClasses > 0 ? Math.round((lateClasses / totalClasses) * 100) : 0;

    return {
      totalStudents: studentCounts.size,
      totalClasses,
      presentClasses,
      lateClasses,
      absentClasses,
      attendanceRate,
      lateRate,
      averageDailyAttendance: Object.keys(dailyAttendance).length > 0 
        ? Math.round(Object.values(dailyAttendance).reduce((a, b) => a + b, 0) / Object.keys(dailyAttendance).length)
        : 0
    };
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      present: 'bg-green-500 text-white',
      late: 'bg-yellow-500 text-white',
      absent: 'bg-red-500 text-white'
    };
    
    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-500 text-white'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const stats = calculateStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalStudents}</div>
          <p className="text-xs text-muted-foreground">Active in system</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
          <p className="text-xs text-muted-foreground">
            {stats.presentClasses + stats.lateClasses} of {stats.totalClasses} classes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Late Rate</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.lateRate}%</div>
          <p className="text-xs text-muted-foreground">
            {stats.lateClasses} late arrivals
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.averageDailyAttendance}</div>
          <p className="text-xs text-muted-foreground">Students per day</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceStats;
