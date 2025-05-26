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

const parseTime = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes; // Convert to minutes since midnight
};

const generateClassKey = (timeSlot: string, subjectId: string): string => {
  return `${timeSlot}_${subjectId}`;
};

const determineAttendanceStatus = (
  scanTimeMinutes: number, 
  classStartMinutes: number, 
  classEndMinutes: number
): 'present' | 'late' | 'absent' => {
  console.log('🕐 Determining attendance status:', {
    scanTimeMinutes,
    classStartMinutes,
    classEndMinutes,
    scanTime: `${Math.floor(scanTimeMinutes / 60)}:${(scanTimeMinutes % 60).toString().padStart(2, '0')}`,
    classStart: `${Math.floor(classStartMinutes / 60)}:${(classStartMinutes % 60).toString().padStart(2, '0')}`,
    classEnd: `${Math.floor(classEndMinutes / 60)}:${(classEndMinutes % 60).toString().padStart(2, '0')}`
  });

  // Grace period: 15 minutes before class starts
  const graceStart = classStartMinutes - 15;
  
  // Late threshold: 15 minutes after class starts
  const lateThreshold = classStartMinutes + 15;
  
  // Absent threshold: 30 minutes after class starts
  const absentThreshold = classStartMinutes + 30;

  console.log('📏 Attendance thresholds:', {
    graceStart: `${Math.floor(graceStart / 60)}:${(graceStart % 60).toString().padStart(2, '0')}`,
    classStart: `${Math.floor(classStartMinutes / 60)}:${(classStartMinutes % 60).toString().padStart(2, '0')}`,
    lateThreshold: `${Math.floor(lateThreshold / 60)}:${(lateThreshold % 60).toString().padStart(2, '0')}`,
    absentThreshold: `${Math.floor(absentThreshold / 60)}:${(absentThreshold % 60).toString().padStart(2, '0')}`
  });

  // Determine status based on timing
  if (scanTimeMinutes >= graceStart && scanTimeMinutes <= lateThreshold) {
    console.log('✅ Status: PRESENT (scanned within grace period or up to 15 min late)');
    return 'present';
  } else if (scanTimeMinutes > lateThreshold && scanTimeMinutes <= absentThreshold) {
    console.log('⚠️ Status: LATE (scanned 15-30 minutes after class start)');
    return 'late';
  } else {
    console.log('❌ Status: ABSENT (scanned more than 30 minutes after class start or too early)');
    return 'absent';
  }
};

const findBestMatchingClass = (
  scanTimeMinutes: number,
  slots: ScheduleSlot[],
  scheduleData: StudentSchedule
): {
  slot: ScheduleSlot;
  status: 'present' | 'late' | 'absent';
  subject: string;
} | null => {
  console.log('🔍 Finding best matching class for scan time:', scanTimeMinutes);

  let bestMatch: {
    slot: ScheduleSlot;
    status: 'present' | 'late' | 'absent';
    subject: string;
    priority: number;
  } | null = null;

  for (const slot of slots) {
    if (!slot.subjectId) continue;

    const [startTime, endTime] = slot.timeSlot.split('-');
    const classStartMinutes = parseTime(startTime);
    const classEndMinutes = parseTime(endTime);

    console.log('🕐 Checking slot:', slot.timeSlot, {
      classStartMinutes,
      classEndMinutes,
      scanTimeMinutes
    });

    // Check if scan time is within reasonable range for this class
    const graceStart = classStartMinutes - 15;
    const absentThreshold = classStartMinutes + 30;

    if (scanTimeMinutes >= graceStart && scanTimeMinutes <= absentThreshold) {
      const subject = scheduleData.subjects[slot.subjectId];
      const subjectName = subject ? `${subject.code} - ${subject.name}` : slot.subjectId;
      
      const status = determineAttendanceStatus(scanTimeMinutes, classStartMinutes, classEndMinutes);
      
      // Priority: prefer classes that are currently happening or about to start
      let priority = 0;
      if (scanTimeMinutes >= classStartMinutes && scanTimeMinutes <= classEndMinutes) {
        priority = 3; // Currently in class
      } else if (scanTimeMinutes >= graceStart && scanTimeMinutes < classStartMinutes) {
        priority = 2; // Before class starts (grace period)
      } else {
        priority = 1; // After class starts
      }

      console.log('⭐ Potential match found:', {
        slot: slot.timeSlot,
        subject: subjectName,
        status,
        priority
      });

      if (!bestMatch || priority > bestMatch.priority) {
        bestMatch = {
          slot,
          status,
          subject: subjectName,
          priority
        };
      }
    }
  }

  if (bestMatch) {
    console.log('🎯 Best match selected:', {
      slot: bestMatch.slot.timeSlot,
      subject: bestMatch.subject,
      status: bestMatch.status
    });
    return {
      slot: bestMatch.slot,
      status: bestMatch.status,
      subject: bestMatch.subject
    };
  }

  console.log('❌ No matching class found');
  return null;
};

export const processAttendance = async (studentId: string, scannedTime: number): Promise<void> => {
  console.log('🎯 Processing attendance for student:', studentId, 'at:', new Date(scannedTime));

  try {
    // Get current date and time info
    const scanDate = new Date(scannedTime);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[scanDate.getDay()];
    const currentTime = scanDate.toTimeString().slice(0, 5);
    const dateKey = scanDate.toISOString().split('T')[0];
    const scanTimeInMinutes = parseTime(currentTime);

    console.log('📅 Scan details:', {
      studentId,
      day: currentDay,
      time: currentTime,
      date: dateKey,
      timestamp: scannedTime,
      scanTimeInMinutes
    });

    // Get student's schedule
    const scheduleRef = ref(database, `schedules/${studentId}`);
    const scheduleSnapshot = await get(scheduleRef);
    const scheduleData = scheduleSnapshot.val() as StudentSchedule | null;

    console.log('📚 Student schedule data:', scheduleData);

    if (!scheduleData) {
      console.log('📋 No schedule found for student:', studentId);
      await recordGeneralAttendance(studentId, scanDate, currentTime, dateKey, scannedTime);
      await markRFIDAsProcessed(studentId);
      return;
    }

    const daySchedule = scheduleData[currentDay];
    console.log('📅 Day schedule for', currentDay, ':', daySchedule);

    if (!daySchedule) {
      console.log('📅 No classes scheduled for', currentDay);
      await recordGeneralAttendance(studentId, scanDate, currentTime, dateKey, scannedTime);
      await markRFIDAsProcessed(studentId);
      return;
    }

    // Get existing attendance records for this day
    const attendanceRef = ref(database, `attendanceRecords/${studentId}/${dateKey}`);
    const existingAttendanceSnapshot = await get(attendanceRef);
    const existingAttendance = (existingAttendanceSnapshot.val() as DayAttendanceRecord) || {};

    console.log('📖 Existing attendance records for today:', existingAttendance);

    // Convert schedule slots to array and sort by time
    const slots: ScheduleSlot[] = Object.values(daySchedule);
    slots.sort((a, b) => {
      const timeA = a.timeSlot.split('-')[0];
      const timeB = b.timeSlot.split('-')[0];
      return parseTime(timeA) - parseTime(timeB);
    });

    console.log('🕐 Available time slots:', slots.map(s => s.timeSlot));

    // Find the best matching time slot
    const bestMatch = findBestMatchingClass(scanTimeInMinutes, slots, scheduleData);

    // If no exact match found, record as general attendance
    if (!bestMatch) {
      console.log('📝 No exact class match - recording general attendance');
      await recordGeneralAttendance(studentId, scanDate, currentTime, dateKey, scannedTime);
      await markRFIDAsProcessed(studentId);
      return;
    }

    // Generate unique key for this class
    const classKey = generateClassKey(bestMatch.slot.timeSlot, bestMatch.slot.subjectId!);

    // Check if attendance for this specific class already exists
    if (existingAttendance[classKey]) {
      console.log('⚠️ Attendance already recorded for this class:', {
        classKey,
        existingRecord: existingAttendance[classKey]
      });
      
      await markRFIDAsProcessed(studentId);
      return;
    }

    // Create new attendance record for this specific class
    const classAttendanceRecord: ClassAttendanceRecord = {
      status: bestMatch.status,
      timeIn: currentTime,
      subject: bestMatch.subject,
      timeSlot: bestMatch.slot.timeSlot,
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

    console.log('✅ Attendance record saved successfully for student:', studentId);
    console.log('📊 Final attendance status:', bestMatch.status.toUpperCase());

    // Check for absence alerts after recording attendance
    if (bestMatch.status === 'absent') {
      console.log('🚨 Student marked absent - checking for absence alert threshold');
      await checkStudentAbsences(studentId);
    }

    // Mark the scanned RFID as processed
    await markRFIDAsProcessed(studentId);

  } catch (error) {
    console.error('❌ Error processing attendance:', error);
    throw error;
  }
};

const recordGeneralAttendance = async (studentId: string, scanDate: Date, currentTime: string, dateKey: string, scannedTime: number) => {
  console.log('📝 Recording general attendance for student:', studentId);
  
  const attendanceRef = ref(database, `attendanceRecords/${studentId}/${dateKey}`);
  const existingAttendanceSnapshot = await get(attendanceRef);
  const existingAttendance = (existingAttendanceSnapshot.val() as DayAttendanceRecord) || {};
  
  // Create a general attendance record
  const generalKey = `general_${currentTime}`;
  
  if (!existingAttendance[generalKey]) {
    const generalAttendanceRecord: ClassAttendanceRecord = {
      status: 'present',
      timeIn: currentTime,
      subject: 'General Check-in',
      timeSlot: currentTime,
      recordedAt: scannedTime
    };

    const updatedDayAttendance = {
      ...existingAttendance,
      [generalKey]: generalAttendanceRecord
    };

    await set(attendanceRef, updatedDayAttendance);
    console.log('✅ General attendance recorded for student:', studentId);
  }
};

const markRFIDAsProcessed = async (studentId: string) => {
  try {
    const student = await getStudentByRFID(studentId);
    if (student && student.rfid) {
      const processedRef = ref(database, `ScannedIDs/${student.rfid}/processed`);
      await set(processedRef, true);
      console.log('✅ RFID marked as processed for student:', studentId);
    }
  } catch (error) {
    console.error('❌ Error marking RFID as processed:', error);
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
