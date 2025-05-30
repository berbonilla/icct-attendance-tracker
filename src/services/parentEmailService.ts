
import emailjs from '@emailjs/browser';

interface ParentAlertData {
  parentEmail: string;
  parentName: string;
  studentName: string;
  studentId: string;
  absentDates: string[];
  totalAbsences: number;
}

// Initialize EmailJS with the new public key
emailjs.init('lfjLSHgrCJDGmTa89');

export const sendParentAbsenceAlert = async (alertData: ParentAlertData): Promise<boolean> => {
  try {
    console.log('📧 Attempting to send absence alert email with EmailJS...', alertData);
    
    // Check if parent email exists
    if (!alertData.parentEmail || alertData.parentEmail.trim() === '') {
      console.error('❌ Parent email is empty or undefined:', alertData.parentEmail);
      return false;
    }
    
    const templateParams = {
      // Using the recipient email variable that matches your template
      email: alertData.parentEmail,  // This should match your template variable
      name: alertData.parentName,    // This should match your template variable
      
      // Additional data for the email content
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
    console.log('📧 Recipient email specifically:', templateParams.email);

    // Send email using EmailJS with the new credentials
    const response = await emailjs.send(
      'service_zhvj92m', // Your new Gmail service ID
      'template_zl3ibr6', // Your new template ID
      templateParams,
      'lfjLSHgrCJDGmTa89' // Your new public key
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
