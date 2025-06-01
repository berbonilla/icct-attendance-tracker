
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { AttendanceData } from '@/types/attendance';
import { DummyDataStudent } from '@/types/dummyData';

interface RecentAttendanceCardProps {
  attendanceData: AttendanceData;
  students: Record<string, DummyDataStudent>;
}

const RecentAttendanceCard: React.FC<RecentAttendanceCardProps> = ({ 
  attendanceData, 
  students 
}) => {
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
      const student = students[studentId];
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

  return (
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
  );
};

export default RecentAttendanceCard;
