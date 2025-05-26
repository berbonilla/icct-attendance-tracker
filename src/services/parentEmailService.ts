
import { MailSlurp } from 'mailslurp-client';

interface ParentAlertData {
  parentEmail: string;
  parentName: string;
  studentName: string;
  studentId: string;
  absentDates: string[];
  totalAbsences: number;
}

const mailslurp = new MailSlurp({ apiKey: 'your-api-key-here' });

export const sendParentAbsenceAlert = async (alertData: ParentAlertData): Promise<boolean> => {
  try {
    console.log('📧 Attempting to send absence alert email...', alertData);
    
    // Create a temporary inbox
    const inbox = await mailslurp.createInbox();
    console.log('📬 Created temporary inbox:', inbox.id);

    const emailSubject = `Absence Alert: ${alertData.studentName} (${alertData.studentId})`;
    const emailBody = `
Dear ${alertData.parentName},

This is an automated notification from the ICCT RFID Attendance System.

Your child, ${alertData.studentName} (Student ID: ${alertData.studentId}), has been absent from ${alertData.totalAbsences} class(es).

Absent dates: ${alertData.absentDates.join(', ')}

Please contact the school if you have any questions or concerns about your child's attendance.

Best regards,
ICCT Attendance System
    `.trim();

    // Send email using proper SendEmailRequest object
    const sendEmailRequest = {
      to: [alertData.parentEmail],
      subject: emailSubject,
      body: emailBody,
      isHTML: false
    };

    const sentEmail = await mailslurp.sendEmail(inbox.id, sendEmailRequest);
    console.log('✅ Email sent successfully:', sentEmail.id);

    // Clean up the temporary inbox
    const deleteRequest = {
      inboxId: inbox.id
    };
    await mailslurp.deleteInbox(deleteRequest);
    console.log('🗑️ Temporary inbox deleted');

    return true;
  } catch (error) {
    console.error('❌ Failed to send absence alert email:', error);
    return false;
  }
};
