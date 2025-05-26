
import { database } from '@/config/firebase';
import { ref, set, get } from 'firebase/database';
import { checkStudentAbsences } from './absenceTrackingService';

interface ScheduleSlot {
  timeSlot: string;
  subjectId: string | null;
}

interface StudentSchedule {
  subjects: Record<string, any>;
  [key: string]: any; // for days of week
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

const parseTime = (timeString: string): { hours: number; minutes: number } => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
};

const createDateWithTime = (baseDate: Date, timeString: string): Date => {
  const { hours, minutes } = parseTime(timeString);
  const newDate = new Date(baseDate);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
};

const generateClassKey = (timeSlot: string, subjectId: string): string => {
  return `${timeSlot}_${subjectId}`;
};

export const processAttendance = async (studentId: string, scannedTime: number): Promise<void> => {
  console.log('🎯 Processing attendance for student:', studentId, 'at:', new Date(scannedTime));

  try {
    // Get current date and time info
    const scanDate = new Date(scannedTime);
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const currentDay = dayNames[scanDate.getDay()];
    const currentTime = scanDate.toTimeString().slice(0, 5);
    const dateKey = scanDate.toISOString().split('T')[0];

    console.log('📅 Scan details:', {
      day: currentDay,
      time: currentTime,
      date: dateKey
    });

    // Get student's schedule
    const scheduleRef = ref(database, `schedules/${studentId}`);
    const scheduleSnapshot = await get(scheduleRef);
    const scheduleData = scheduleSnapshot.val() as StudentSchedule | null;

    if (!scheduleData) {
      console.log('📋 No schedule found for student:', studentId);
      // Mark RFID as processed even if no schedule
      const student = await getStudentByRFID(studentId);
      if (student) {
        const processedRef = ref(database, `ScannedIDs/${student.rfid}/processed`);
        await set(processedRef, true);
      }
      return;
    }

    // Map day abbreviations to full day names
    const dayMapping: Record<string, string> = {
      'mon': 'monday',
      'tue': 'tuesday', 
      'wed': 'wednesday',
      'thu': 'thursday',
      'fri': 'friday',
      'sat': 'saturday',
      'sun': 'sunday'
    };

    const fullDayName = dayMapping[currentDay];
    const daySchedule = scheduleData[fullDayName];

    if (!daySchedule) {
      console.log('📅 No classes scheduled for', fullDayName);
      // Mark RFID as processed even if no classes today
      const student = await getStudentByRFID(studentId);
      if (student) {
        const processedRef = ref(database, `ScannedIDs/${student.rfid}/processed`);
        await set(processedRef, true);
      }
      return;
    }

    console.log('📚 Day schedule:', daySchedule);

    // Get existing attendance records for this day
    const attendanceRef = ref(database, `attendanceRecords/${studentId}/${dateKey}`);
    const existingAttendanceSnapshot = await get(attendanceRef);
    const existingAttendance = (existingAttendanceSnapshot.val() as DayAttendanceRecord) || {};

    console.log('📖 Existing attendance records for today:', existingAttendance);

    // Find the current or next class based on scan time
    let attendanceStatus: 'present' | 'late' | 'absent' = 'absent';
    let currentSubject = '';
    let matchedTimeSlot = '';
    let matchedSubjectId = '';

    // Convert schedule slots to array and sort by time
    const slots: ScheduleSlot[] = Object.values(daySchedule);
    slots.sort((a, b) => {
      const timeA = a.timeSlot.split('-')[0];
      const timeB = b.timeSlot.split('-')[0];
      return timeA.localeCompare(timeB);
    });

    console.log('🕐 Available time slots:', slots.map(s => s.timeSlot));

    for (const slot of slots) {
      if (!slot.subjectId) continue;

      // Parse time slot
      const [startTime, endTime] = slot.timeSlot.split('-');
      
      // Create Date objects for comparison
      const classStart = createDateWithTime(scanDate, startTime);
      const classEnd = createDateWithTime(scanDate, endTime);

      // Calculate time boundaries for attendance rules
      const late15Min = new Date(classStart.getTime() + 15 * 60 * 1000);
      const late30Min = new Date(classStart.getTime() + 30 * 60 * 1000);

      console.log('⏰ Checking slot:', slot.timeSlot, {
        classStart: classStart.toTimeString().slice(0, 5),
        classEnd: classEnd.toTimeString().slice(0, 5),
        late15Min: late15Min.toTimeString().slice(0, 5),
        late30Min: late30Min.toTimeString().slice(0, 5),
        scanTime: scanDate.toTimeString().slice(0, 5)
      });

      // Check if scan time falls within class period (with extended window for attendance)
      if (scanDate >= classStart && scanDate <= late30Min) {
        // Get subject info
        const subject = scheduleData.subjects[slot.subjectId];
        currentSubject = subject ? `${subject.code} - ${subject.name}` : slot.subjectId;
        matchedTimeSlot = slot.timeSlot;
        matchedSubjectId = slot.subjectId;

        // Determine attendance status based on timing rules
        if (scanDate <= late15Min) {
          attendanceStatus = 'present';
          console.log('✅ Student is PRESENT (scanned within 15 minutes of class start)');
        } else if (scanDate <= late30Min) {
          attendanceStatus = 'late';
          console.log('⚠️ Student is LATE (scanned 15-30 minutes after class start)');
        } else {
          attendanceStatus = 'absent';
          console.log('❌ Student is ABSENT (scanned more than 30 minutes after class start)');
        }
        break;
      }
    }

    if (!matchedTimeSlot || !matchedSubjectId) {
      console.log('❌ No matching class found for scan time - student may be scanning outside class hours');
      // Mark RFID as processed but don't record attendance
      const student = await getStudentByRFID(studentId);
      if (student) {
        const processedRef = ref(database, `ScannedIDs/${student.rfid}/processed`);
        await set(processedRef, true);
      }
      return;
    }

    // Generate unique key for this class
    const classKey = generateClassKey(matchedTimeSlot, matchedSubjectId);

    // Check if attendance for this specific class already exists
    if (existingAttendance[classKey]) {
      console.log('⚠️ Attendance already recorded for this class:', {
        classKey,
        existingRecord: existingAttendance[classKey]
      });
      
      // Mark the scanned RFID as processed but don't update attendance
      const student = await getStudentByRFID(studentId);
      if (student) {
        const processedRef = ref(database, `ScannedIDs/${student.rfid}/processed`);
        await set(processedRef, true);
        console.log('✅ RFID marked as processed (attendance already exists)');
      }
      return;
    }

    // Create new attendance record for this specific class
    const classAttendanceRecord: ClassAttendanceRecord = {
      status: attendanceStatus,
      timeIn: currentTime,
      subject: currentSubject,
      timeSlot: matchedTimeSlot,
      recordedAt: scannedTime
    };

    // Merge with existing attendance records for the day
    const updatedDayAttendance = {
      ...existingAttendance,
      [classKey]: classAttendanceRecord
    };

    console.log('📝 Creating attendance record:', {
      classKey,
      record: classAttendanceRecord,
      fullDayAttendance: updatedDayAttendance
    });

    // Save updated attendance records to Firebase
    await set(attendanceRef, updatedDayAttendance);

    console.log('✅ Attendance record saved successfully');

    // Check for absence alerts after recording attendance
    if (attendanceStatus === 'absent') {
      console.log('🚨 Student marked absent - checking for absence alert threshold');
      await checkStudentAbsences(studentId);
    }

    // Mark the scanned RFID as processed
    const student = await getStudentByRFID(studentId);
    if (student) {
      const processedRef = ref(database, `ScannedIDs/${student.rfid}/processed`);
      await set(processedRef, true);
      console.log('✅ RFID marked as processed');
    }

  } catch (error) {
    console.error('❌ Error processing attendance:', error);
    throw error;
  }
};

const getStudentByRFID = async (studentId: string) => {
  try {
    const studentRef = ref(database, `students/${studentId}`);
    const snapshot = await get(studentRef);
    return snapshot.val();
  } catch (error) {
    console.error('Error getting student by ID:', error);
    return null;
  }
};
