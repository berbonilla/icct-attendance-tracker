
import { database } from '@/config/firebase';
import { ref, set, get } from 'firebase/database';

interface ScheduleSlot {
  timeSlot: string;
  subjectId: string | null;
}

interface StudentSchedule {
  subjects: Record<string, any>;
  [key: string]: any; // for days of week
}

interface AttendanceRecord {
  status: 'present' | 'absent' | 'late';
  timeIn?: string;
  timeOut?: string;
  subject?: string;
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

export const processAttendance = async (studentId: string, scannedTime: number): Promise<void> => {
  console.log('🎯 Processing attendance for student:', studentId, 'at:', new Date(scannedTime));

  try {
    // Get current date and time info
    const scanDate = new Date(scannedTime);
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const currentDay = dayNames[scanDate.getDay()]; // Get day abbreviation correctly
    const currentTime = scanDate.toTimeString().slice(0, 5); // HH:MM format
    const dateKey = scanDate.toISOString().split('T')[0]; // YYYY-MM-DD

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
      return;
    }

    console.log('📚 Day schedule:', daySchedule);

    // Find the current or next class
    let attendanceStatus: 'present' | 'late' | 'absent' = 'absent';
    let currentSubject = '';

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

      // Parse time slot (supporting flexible formats like "08:15-10:30")
      const [startTime, endTime] = slot.timeSlot.split('-');
      
      // Create Date objects for comparison with flexible time support
      const classStart = createDateWithTime(scanDate, startTime);
      const classEnd = createDateWithTime(scanDate, endTime);

      // Calculate time boundaries
      const late15Min = new Date(classStart.getTime() + 15 * 60 * 1000);
      const late30Min = new Date(classStart.getTime() + 30 * 60 * 1000);

      console.log('⏰ Checking slot:', slot.timeSlot, {
        classStart: classStart.toTimeString().slice(0, 5),
        classEnd: classEnd.toTimeString().slice(0, 5),
        late15Min: late15Min.toTimeString().slice(0, 5),
        late30Min: late30Min.toTimeString().slice(0, 5),
        scanTime: scanDate.toTimeString().slice(0, 5)
      });

      // Check if scan time falls within this class period (including 30min grace)
      if (scanDate >= classStart && scanDate <= late30Min) {
        // Get subject info
        const subject = scheduleData.subjects[slot.subjectId];
        currentSubject = subject ? `${subject.code} - ${subject.name}` : slot.subjectId;

        // Determine attendance status
        if (scanDate <= classStart) {
          attendanceStatus = 'present';
          console.log('✅ Student is PRESENT (on time)');
        } else if (scanDate <= late15Min) {
          attendanceStatus = 'present';
          console.log('✅ Student is PRESENT (within 15 min)');
        } else if (scanDate <= late30Min) {
          attendanceStatus = 'late';
          console.log('⚠️ Student is LATE (15-30 min after start)');
        }
        break;
      }
    }

    // Create attendance record
    const attendanceRecord: AttendanceRecord = {
      status: attendanceStatus,
      timeIn: currentTime,
      subject: currentSubject
    };

    console.log('📝 Creating attendance record:', attendanceRecord);

    // Save to Firebase
    const attendanceRef = ref(database, `attendanceRecords/${studentId}/${dateKey}`);
    await set(attendanceRef, attendanceRecord);

    console.log('✅ Attendance record saved successfully');

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
