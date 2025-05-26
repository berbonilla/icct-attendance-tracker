
import emailjs from '@emailjs/browser';

interface ParentAlertData {
  parentEmail: string;
  parentName: string;
  studentName: string;
  studentId: string;
  absentDates: string[];
  totalAbsences: number;
}

// Initialize EmailJS with your public key
emailjs.init('T1-ak1I2qtEeyE-a_');

export const sendParentAbsenceAlert = async (alertData: ParentAlertData): Promise<boolean> => {
  try {
    console.log('📧 Attempting to send absence alert email with EmailJS...', alertData);
    
    const templateParams = {
      to_email: alertData.parentEmail,
      to_name: alertData.parentName,
      student_name: alertData.studentName,
      student_id: alertData.studentId,
      absent_dates: alertData.absentDates.join(', '),
      total_absences: alertData.totalAbsences.toString(),
      subject: `Absence Alert: ${alertData.studentName} (${alertData.studentId})`,
      message: `Dear ${alertData.parentName},

This is an automated notification from the ICCT RFID Attendance System.

Your child, ${alertData.studentName} (Student ID: ${alertData.studentId}), has been absent from ${alertData.totalAbsences} class(es).

Absent dates: ${alertData.absentDates.join(', ')}

Please contact the school if you have any questions or concerns about your child's attendance.

Best regards,
ICCT Attendance System`
    };

    // Send email using EmailJS
    // Note: You'll need to create a service and template in your EmailJS dashboard
    // and replace 'your_service_id' and 'your_template_id' with actual values
    const response = await emailjs.send(
      'your_service_id', // Replace with your EmailJS service ID
      'your_template_id', // Replace with your EmailJS template ID
      templateParams,
      'Db7C53JtWXxHZPunJog2k' // Your private key
    );

    console.log('✅ Email sent successfully with EmailJS:', response);
    return true;
  } catch (error) {
    console.error('❌ Failed to send absence alert email with EmailJS:', error);
    return false;
  }
};
