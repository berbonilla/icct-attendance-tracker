
import { database } from '@/config/firebase';
import { ref, get, set, onValue, off } from 'firebase/database';
import { sendParentAbsenceAlert } from './parentEmailService';

interface Student {
  name: string;
  parentName: string;
  parentEmail: string;
  rfid: string;
  email: string;
  course: string;
  year: string;
  section: string;
}

interface ClassAttendanceRecord {
  status: 'present' | 'absent' | 'late';
  timeIn?: string;
  timeOut?: string;
  subject: string;
  timeSlot: string;
  recordedAt: number;
}

interface DayAttendanceRecord {
  [classKey: string]: ClassAttendanceRecord;
}

interface AbsenceAlert {
  studentId: string;
  parentEmail: string;
  alertSentAt: number;
  totalAbsencesAtTime: number;
  absentDates: string[];
}

// Track students who have already been alerted for 3 absences
const alertedStudents = new Set<string>();

const countStudentAbsences = (attendanceData: Record<string, DayAttendanceRecord>): { count: number; dates: string[] } => {
  let absenceCount = 0;
  const absentDates: string[] = [];
  
  Object.entries(attendanceData).forEach(([date, dayRecord]) => {
    // Check if student was absent for any class on this date
    const dayAbsences = Object.values(dayRecord).filter(record => record.status === 'absent');
    if (dayAbsences.length > 0) {
      absenceCount += dayAbsences.length;
      absentDates.push(date);
    }
  });
  
  return { count: absenceCount, dates: absentDates };
};

const getStudent = async (studentId: string): Promise<Student | null> => {
  try {
    const studentRef = ref(database, `students/${studentId}`);
    const snapshot = await get(studentRef);
    return snapshot.val();
  } catch (error) {
    console.error('Error fetching student data:', error);
    return null;
  }
};

const recordAbsenceAlert = async (studentId: string, alertData: AbsenceAlert): Promise<void> => {
  try {
    const alertRef = ref(database, `absenceAlerts/${studentId}/${Date.now()}`);
    await set(alertRef, alertData);
    console.log('✅ Absence alert recorded in database for student:', studentId);
  } catch (error) {
    console.error('❌ Failed to record absence alert:', error);
  }
};

const checkAndSendAbsenceAlert = async (studentId: string, attendanceData: Record<string, DayAttendanceRecord>): Promise<void> => {
  // Skip if we've already sent an alert for this student
  if (alertedStudents.has(studentId)) {
    return;
  }
  
  const { count: absenceCount, dates: absentDates } = countStudentAbsences(attendanceData);
  
  console.log(`📊 Student ${studentId} absence check:`, {
    totalAbsences: absenceCount,
    absentDates: absentDates.length,
    threshold: 3
  });
  
  // Send alert if student has 3 or more absences
  if (absenceCount >= 3) {
    console.log(`🚨 Student ${studentId} has ${absenceCount} absences - sending parent alert`);
    
    const student = await getStudent(studentId);
    if (!student) {
      console.error(`❌ Could not find student data for ID: ${studentId}`);
      return;
    }
    
    if (!student.parentEmail || !student.parentName) {
      console.error(`❌ Missing parent information for student: ${studentId}`);
      return;
    }
    
    try {
      const emailSuccess = await sendParentAbsenceAlert({
        parentEmail: student.parentEmail,
        parentName: student.parentName,
        studentName: student.name,
        studentId: studentId,
        absentDates: absentDates,
        totalAbsences: absenceCount
      });
      
      if (emailSuccess) {
        // Mark this student as alerted to prevent duplicate emails
        alertedStudents.add(studentId);
        
        // Record the alert in the database
        await recordAbsenceAlert(studentId, {
          studentId,
          parentEmail: student.parentEmail,
          alertSentAt: Date.now(),
          totalAbsencesAtTime: absenceCount,
          absentDates: absentDates
        });
        
        console.log(`✅ Absence alert sent successfully for student ${studentId}`);
      } else {
        console.error(`❌ Failed to send absence alert for student ${studentId}`);
      }
    } catch (error) {
      console.error(`❌ Error sending absence alert for student ${studentId}:`, error);
    }
  }
};

export const initializeAbsenceTracking = (): (() => void) => {
  console.log('🔍 Initializing absence tracking system...');
  
  const attendanceRef = ref(database, 'attendanceRecords');
  
  const unsubscribe = onValue(attendanceRef, (snapshot) => {
    const allAttendanceData = snapshot.val();
    
    if (!allAttendanceData) {
      console.log('📊 No attendance data found for absence tracking');
      return;
    }
    
    console.log('📊 Processing attendance data for absence tracking...');
    
    // Check each student's attendance
    Object.entries(allAttendanceData).forEach(([studentId, studentAttendance]) => {
      checkAndSendAbsenceAlert(studentId, studentAttendance as Record<string, DayAttendanceRecord>);
    });
  }, (error) => {
    console.error('❌ Error in absence tracking listener:', error);
  });
  
  // Return cleanup function
  return () => {
    off(attendanceRef);
    unsubscribe();
    console.log('🔍 Absence tracking system cleaned up');
  };
};

// Manual function to check a specific student's absences
export const checkStudentAbsences = async (studentId: string): Promise<void> => {
  try {
    const attendanceRef = ref(database, `attendanceRecords/${studentId}`);
    const snapshot = await get(attendanceRef);
    const attendanceData = snapshot.val();
    
    if (attendanceData) {
      await checkAndSendAbsenceAlert(studentId, attendanceData);
    }
  } catch (error) {
    console.error('❌ Error checking student absences:', error);
  }
};

// Reset the alerted students cache (useful for testing or daily resets)
export const resetAbsenceAlerts = (): void => {
  alertedStudents.clear();
  console.log('🔄 Absence alert cache cleared');
};
