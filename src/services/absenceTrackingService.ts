
import { database } from '@/config/firebase';
import { ref, get, set, onValue, off, query, orderByChild, equalTo } from 'firebase/database';
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
  emailSent: boolean;
}

// Processing queue to prevent conflicts
const processingQueue = new Set<string>();
let isProcessing = false;
const DEBOUNCE_DELAY = 2000; // 2 seconds debounce
let processTimeout: NodeJS.Timeout | null = null;

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
    console.error('❌ Error fetching student data:', error);
    return null;
  }
};

const checkExistingAlert = async (studentId: string, currentAbsenceCount: number): Promise<boolean> => {
  try {
    const alertsRef = ref(database, `absenceAlerts/${studentId}`);
    const snapshot = await get(alertsRef);
    const alerts = snapshot.val();
    
    if (!alerts) {
      console.log(`📊 No previous alerts found for student ${studentId}`);
      return false;
    }
    
    // Check if we already sent an alert for this absence count or higher
    const existingAlerts = Object.values(alerts) as AbsenceAlert[];
    const hasExistingAlert = existingAlerts.some(alert => 
      alert.emailSent && alert.totalAbsencesAtTime >= currentAbsenceCount
    );
    
    if (hasExistingAlert) {
      console.log(`✅ Alert already sent for student ${studentId} with ${currentAbsenceCount} absences`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error checking existing alerts:', error);
    return false; // If we can't check, proceed with sending to be safe
  }
};

const recordAbsenceAlert = async (studentId: string, alertData: AbsenceAlert): Promise<void> => {
  try {
    const alertKey = `${Date.now()}_${alertData.totalAbsencesAtTime}`;
    const alertRef = ref(database, `absenceAlerts/${studentId}/${alertKey}`);
    await set(alertRef, alertData);
    console.log('✅ Absence alert recorded in database for student:', studentId);
  } catch (error) {
    console.error('❌ Failed to record absence alert:', error);
  }
};

const processStudentAbsences = async (studentId: string, attendanceData: Record<string, DayAttendanceRecord>): Promise<void> => {
  // Prevent duplicate processing
  if (processingQueue.has(studentId)) {
    console.log(`⏭️ Student ${studentId} already being processed, skipping`);
    return;
  }
  
  processingQueue.add(studentId);
  
  try {
    const { count: absenceCount, dates: absentDates } = countStudentAbsences(attendanceData);
    
    console.log(`📊 Student ${studentId} absence check:`, {
      totalAbsences: absenceCount,
      absentDates: absentDates.length,
      threshold: 3
    });
    
    // Only process if student has 3 or more absences
    if (absenceCount >= 3) {
      console.log(`🚨 Student ${studentId} has ${absenceCount} absences - checking if alert needed`);
      
      // Check if we already sent an alert for this absence level
      const alertAlreadySent = await checkExistingAlert(studentId, absenceCount);
      if (alertAlreadySent) {
        console.log(`✅ Alert already exists for student ${studentId}, skipping email`);
        return;
      }
      
      const student = await getStudent(studentId);
      if (!student) {
        console.error(`❌ Could not find student data for ID: ${studentId}`);
        return;
      }
      
      if (!student.parentEmail || !student.parentName) {
        console.error(`❌ Missing parent information for student: ${studentId}`);
        return;
      }
      
      console.log(`📧 Sending new absence alert for student ${studentId}`);
      
      // Record alert attempt first
      const alertData: AbsenceAlert = {
        studentId,
        parentEmail: student.parentEmail,
        alertSentAt: Date.now(),
        totalAbsencesAtTime: absenceCount,
        absentDates: absentDates,
        emailSent: false
      };
      
      await recordAbsenceAlert(studentId, alertData);
      
      // Send email
      const emailSuccess = await sendParentAbsenceAlert({
        parentEmail: student.parentEmail,
        parentName: student.parentName,
        studentName: student.name,
        studentId: studentId,
        absentDates: absentDates,
        totalAbsences: absenceCount
      });
      
      if (emailSuccess) {
        // Update alert record to mark email as sent
        alertData.emailSent = true;
        await recordAbsenceAlert(studentId, alertData);
        console.log(`✅ Absence alert sent successfully for student ${studentId}`);
      } else {
        console.error(`❌ Failed to send absence alert for student ${studentId}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error processing student ${studentId} absences:`, error);
  } finally {
    // Remove from processing queue
    processingQueue.delete(studentId);
  }
};

const debouncedProcessAttendance = (allAttendanceData: Record<string, Record<string, DayAttendanceRecord>>) => {
  if (processTimeout) {
    clearTimeout(processTimeout);
  }
  
  processTimeout = setTimeout(async () => {
    if (isProcessing) {
      console.log('📊 Already processing attendance, skipping this cycle');
      return;
    }
    
    isProcessing = true;
    console.log('📊 Processing attendance data for absence tracking...');
    
    try {
      // Process students sequentially to avoid conflicts
      const studentIds = Object.keys(allAttendanceData);
      for (const studentId of studentIds) {
        await processStudentAbsences(studentId, allAttendanceData[studentId]);
        // Small delay between students to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('❌ Error in batch processing:', error);
    } finally {
      isProcessing = false;
      console.log('✅ Attendance processing cycle completed');
    }
  }, DEBOUNCE_DELAY);
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
    
    debouncedProcessAttendance(allAttendanceData);
  }, (error) => {
    console.error('❌ Error in absence tracking listener:', error);
  });
  
  // Return cleanup function
  return () => {
    if (processTimeout) {
      clearTimeout(processTimeout);
    }
    off(attendanceRef);
    unsubscribe();
    processingQueue.clear();
    isProcessing = false;
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
      await processStudentAbsences(studentId, attendanceData);
    }
  } catch (error) {
    console.error('❌ Error checking student absences:', error);
  }
};

// Reset function for testing or administrative purposes
export const resetAbsenceAlerts = async (studentId?: string): Promise<void> => {
  try {
    if (studentId) {
      const alertRef = ref(database, `absenceAlerts/${studentId}`);
      await set(alertRef, null);
      console.log(`🔄 Absence alerts cleared for student: ${studentId}`);
    } else {
      const alertRef = ref(database, 'absenceAlerts');
      await set(alertRef, null);
      console.log('🔄 All absence alerts cleared');
    }
  } catch (error) {
    console.error('❌ Error resetting absence alerts:', error);
  }
};
