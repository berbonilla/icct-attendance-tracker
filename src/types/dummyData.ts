
export interface DummyDataStudent {
  name: string;
  course: string;
  year: string;
  section: string;
  rfid?: string;
}

export interface DummyDataAttendanceRecord {
  status: 'present' | 'absent' | 'late';
  timeIn?: string;
  timeOut?: string;
}

export interface DummyDataStructure {
  students: Record<string, DummyDataStudent>;
  attendanceRecords: Record<string, Record<string, DummyDataAttendanceRecord>>;
  schedules: Record<string, Record<string, string[]>>;
  adminUsers: Record<string, { name: string; password: string }>;
  absenteeAlerts: Record<string, string[]>;
}
