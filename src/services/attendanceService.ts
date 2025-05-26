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
  console.log('🕐 Determining attendance status with NEW LOGIC:', {
    scanTimeMinutes,
    classStartMinutes,
    classEndMinutes,
    scanTime: `${Math.floor(scanTimeMinutes / 60)}:${(scanTimeMinutes % 60).toString().padStart(2, '0')}`,
    classStart: `${Math.floor(classStartMinutes / 60)}:${(classStartMinutes % 60).toString().padStart(2, '0')}`,
    classEnd: `${Math.floor(classEndMinutes / 60)}:${(classEndMinutes % 60).toString().padStart(2, '0')}`
  });

  // PRESENT: Scan within 15 minutes before class start OR within 15 minutes after class start
  const presentWindowStart = classStartMinutes - 15; // 15 minutes before class
  const presentWindowEnd = classStartMinutes + 15;   // 15 minutes after class starts
  
  // LATE: Scan between 15-30 minutes after class start
  const lateWindowStart = classStartMinutes + 15;    // 15 minutes after class starts
  const lateWindowEnd = classStartMinutes + 30;      // 30 minutes after class starts
  
  console.log('📏 NEW Attendance windows:', {
    presentWindow: `${Math.floor(presentWindowStart / 60)}:${(presentWindowStart % 60).toString().padStart(2, '0')} - ${Math.floor(presentWindowEnd / 60)}:${(presentWindowEnd % 60).toString().padStart(2, '0')}`,
    lateWindow: `${Math.floor(lateWindowStart / 60)}:${(lateWindowStart % 60).toString().padStart(2, '0')} - ${Math.floor(lateWindowEnd / 60)}:${(lateWindowEnd % 60).toString().padStart(2, '0')}`,
    absentAfter: `${Math.floor(lateWindowEnd / 60)}:${(lateWindowEnd % 60).toString().padStart(2, '0')}`
  });

  // PRESENT: Within 15 minutes before or after class start
  if (scanTimeMinutes >= presentWindowStart && scanTimeMinutes <= presentWindowEnd) {
    console.log('✅ Status: PRESENT (scanned within 15 minutes of class start)');
    return 'present';
  }
  
  // LATE: Between 15-30 minutes after class start
  else if (scanTimeMinutes > lateWindowStart && scanTimeMinutes <= lateWindowEnd) {
    console.log('⚠️ Status: LATE (scanned 15-30 minutes after class start)');
    return 'late';
  }
  
  // ABSENT: Outside all acceptable windows
  else {
    if (scanTimeMinutes > lateWindowEnd) {
      console.log('❌ Status: ABSENT (scanned more than 30 minutes after class start)');
    } else {
      console.log('❌ Status: ABSENT (scanned more than 15 minutes before class start)');
    }
    return 'absent';
  }
};

const findMatchingClass = (
  scanTimeMinutes: number,
  slots: ScheduleSlot[],
  scheduleData: StudentSchedule
): {
  slot: ScheduleSlot;
  status: 'present' | 'late' | 'absent';
  subject: string;
} | null => {
  console.log('🔍 Finding matching class for scan time:', {
    scanTimeMinutes,
    scanTime: `${Math.floor(scanTimeMinutes / 60)}:${(scanTimeMinutes % 60).toString().padStart(2, '0')}`,
    availableSlots: slots.map(s => s.timeSlot)
  });

  let bestMatch: {
    slot: ScheduleSlot;
    status: 'present' | 'late' | 'absent';
    subject: string;
    timeDifference: number;
  } | null = null;

  for (const slot of slots) {
    if (!slot.subjectId) continue;

    const [startTime, endTime] = slot.timeSlot.split('-');
    const classStartMinutes = parseTime(startTime);
    const classEndMinutes = parseTime(endTime);

    console.log('🕐 Checking class:', slot.timeSlot, {
      classStartMinutes,
      classEndMinutes,
      scanTimeMinutes
    });

    // Calculate how close the scan time is to the class start time
    const timeDifference = Math.abs(scanTimeMinutes - classStartMinutes);
    
    // Only consider classes within a reasonable window (2 hours before to 2 hours after class start)
    const maxTimeWindow = 120; // 2 hours in minutes
    
    if (timeDifference <= maxTimeWindow) {
      const subject = scheduleData.subjects[slot.subjectId];
      const subjectName = subject ? `${subject.code} - ${subject.name}` : slot.subjectId;
      
      const status = determineAttendanceStatus(scanTimeMinutes, classStartMinutes, classEndMinutes);
      
      console.log('⭐ Potential match found:', {
        slot: slot.timeSlot,
        subject: subjectName,
        status,
        timeDifference: `${timeDifference} minutes from class start`
      });

      // Always prefer the closest class by time difference
      if (!bestMatch || timeDifference < bestMatch.timeDifference) {
        bestMatch = {
          slot,
          status,
          subject: subjectName,
          timeDifference
        };
      }
    } else {
      console.log('⏰ Class too far from scan time:', {
        slot: slot.timeSlot,
        timeDifference: `${timeDifference} minutes (exceeds ${maxTimeWindow} minute window)`
      });
    }
  }

  if (bestMatch) {
    console.log('🎯 Best match selected:', {
      slot: bestMatch.slot.timeSlot,
      subject: bestMatch.subject,
      status: bestMatch.status,
      timeDifference: `${bestMatch.timeDifference} minutes from class start`
    });
    return {
      slot: bestMatch.slot,
      status: bestMatch.status,
      subject: bestMatch.subject
    };
  }

  console.log('❌ No matching class found within reasonable timeframe');
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

    if (!daySchedule || Object.keys(daySchedule).length === 0) {
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

    // Find the best matching class based on scan time vs class schedule
    const matchingClass = findMatchingClass(scanTimeInMinutes, slots, scheduleData);

    // If no class match found, record as general attendance
    if (!matchingClass) {
      console.log('📝 No class match found - recording general attendance');
      await recordGeneralAttendance(studentId, scanDate, currentTime, dateKey, scannedTime);
      await markRFIDAsProcessed(studentId);
      return;
    }

    // Generate unique key for this class
    const classKey = generateClassKey(matchingClass.slot.timeSlot, matchingClass.slot.subjectId!);

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
      status: matchingClass.status,
      timeIn: currentTime,
      subject: matchingClass.subject,
      timeSlot: matchingClass.slot.timeSlot,
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
    console.log('📊 Final attendance status:', matchingClass.status.toUpperCase());

    // Check for absence alerts after recording attendance
    if (matchingClass.status === 'absent') {
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
