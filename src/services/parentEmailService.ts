
import emailjs from '@emailjs/browser';

interface ParentAlertData {
  parentEmail: string;
  parentName: string;
  studentName: string;
  studentId: string;
  absentDates: string[];
  totalAbsences: number;
}

// Initialize EmailJS with the correct public key
emailjs.init('T1-ak1I2qtEeyE-a_');

export const sendParentAbsenceAlert = async (alertData: ParentAlertData): Promise<boolean> => {
  try {
    console.log('📧 Attempting to send absence alert email with EmailJS...', alertData);
    
    // Check if parent email exists
    if (!alertData.parentEmail || alertData.parentEmail.trim() === '') {
      console.error('❌ Parent email is empty or undefined:', alertData.parentEmail);
      return false;
    }
    
    const templateParams = {
      // Try multiple common parameter names for recipient email
      to_email: alertData.parentEmail,
      user_email: alertData.parentEmail,
      email: alertData.parentEmail,
      recipient_email: alertData.parentEmail,
      
      to_name: alertData.parentName,
      user_name: alertData.parentName,
      parent_name: alertData.parentName,
      
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

    console.log('📧 Template parameters being sent:', templateParams);

    // Send email using EmailJS with corrected configuration
    const response = await emailjs.send(
      'service_n24pbcp', // Your Gmail service ID
      'template_98tti9a', // Your Auto-Reply template ID
      templateParams,
      'T1-ak1I2qtEeyE-a_' // Use the correct public key here
    );

    console.log('✅ Email sent successfully with EmailJS:', response);
    return true;
  } catch (error) {
    console.error('❌ Failed to send absence alert email with EmailJS:', error);
    
    // Additional debugging information
    if (error && typeof error === 'object' && 'text' in error) {
      console.error('❌ EmailJS error details:', error.text);
    }
    
    return false;
  }
};
