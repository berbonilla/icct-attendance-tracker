
export interface ClassAttendanceRecord {
  status: 'present' | 'absent' | 'late';
  timeIn?: string;
  timeOut?: string;
  subject: string;
  timeSlot: string;
  recordedAt: number;
}

export interface DayAttendanceRecord {
  [classKey: string]: ClassAttendanceRecord;
}

export interface AttendanceRecord {
  status: 'present' | 'absent' | 'late';
  timeIn?: string;
  timeOut?: string;
  subject?: string;
}

export interface Student {
  name: string;
  course: string;
  year: string;
  section: string;
  rfid?: string;
}

export interface AdminUser {
  name: string;
  password: string;
}

export type AttendanceData = Record<string, Record<string, AttendanceRecord | DayAttendanceRecord>>;
