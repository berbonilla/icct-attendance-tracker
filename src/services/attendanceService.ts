
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
    let bestMatch: {
      slot: ScheduleSlot;
      status: 'present' | 'late' | 'absent';
      subject: string;
    } | null = null;

    for (const slot of slots) {
      if (!slot.subjectId) continue;

      // Parse time slot
      const [startTime, endTime] = slot.timeSlot.split('-');
      const classStartMinutes = parseTime(startTime);
      const classEndMinutes = parseTime(endTime);
      
      // Define timing rules:
      // - Present: scan within 15 minutes before start to 15 minutes after start
      // - Late: scan 15-30 minutes after start
      // - Absent: scan more than 30 minutes after start OR more than 15 minutes before start
      const earlyWindow = classStartMinutes - 15; // 15 minutes before class
      const lateThreshold = classStartMinutes + 15; // 15 minutes after start
      const absentThreshold = classStartMinutes + 30; // 30 minutes after start

      console.log('⏰ Checking slot:', slot.timeSlot, {
        classStart: startTime,
        classEnd: endTime,
        classStartMinutes,
        classEndMinutes,
        scanTimeInMinutes,
        earlyWindow,
        lateThreshold,
        absentThreshold,
        currentTime
      });

      // Check if this is the right class to mark attendance for
      if (scanTimeInMinutes >= earlyWindow && scanTimeInMinutes <= absentThreshold) {
        // Get subject info
        const subject = scheduleData.subjects[slot.subjectId];
        const subjectName = subject ? `${subject.code} - ${subject.name}` : slot.subjectId;

        // Determine status based on timing
        let status: 'present' | 'late' | 'absent';
        if (scanTimeInMinutes <= lateThreshold) {
          status = 'present';
          console.log('✅ Student is PRESENT (scanned within 15 minutes of class start)');
        } else if (scanTimeInMinutes <= absentThreshold) {
          status = 'late';
          console.log('⚠️ Student is LATE (scanned 15-30 minutes after class start)');
        } else {
          status = 'absent';
          console.log('❌ Student is ABSENT (scanned more than 30 minutes after class start)');
        }

        bestMatch = {
          slot,
          status,
          subject: subjectName
        };
        break; // Take the first matching class
      }
    }

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
