
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
    
    // Create email content with student name replacing {{Name}} placeholder
    const emailContent = `Hi,

I hope this message finds you well.

I am writing to inform you that our attendance system has marked your child, ${alertData.studentName}, as absent for three consecutive days this past week. Please be advised that such consecutive absences trigger an alert in our system as part of our commitment to maintaining accurate attendance records and ensuring the wellbeing of all our students.

We understand that absences may be due to various reasons, such as illness or family emergencies. However, we kindly request that you provide a written explanation for these absences so that we can properly update our records and offer any necessary support to your child.

If you have already communicated with the school regarding these absences, please disregard this message. Otherwise, we would appreciate it if you could contact us as soon as possible.

Thank you for your understanding and cooperation.

Best regards,
ICCT ADMIN`;
    
    const templateParams = {
      // Using the recipient email variable that matches your template
      email: alertData.parentEmail,  // This should match your template variable
      name: alertData.parentName,    // This should match your template variable
      
      // Additional data for the email content
      student_name: alertData.studentName,
      student_id: alertData.studentId,
      absent_dates: alertData.absentDates.join(', '),
      total_absences: alertData.totalAbsences.toString(),
      subject: `Attendance Alert - ${alertData.studentName}`,
      message: emailContent
    };

    console.log('📧 Template parameters being sent:', templateParams);
    console.log('📧 Recipient email specifically:', templateParams.email);
    console.log('📧 Email content with student name:', emailContent);

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
