
import { MailSlurp } from 'mailslurp-client';

const mailslurp = new MailSlurp({ 
  apiKey: "04fee299dfad020de401a28bcdec5d33329c41f092dcb017082e067b719b67b3" 
});

interface EmailParams {
  parentEmail: string;
  parentName: string;
  studentName: string;
  studentId: string;
  absentDates: string[];
  totalAbsences: number;
}

const generateAbsenceEmailContent = (params: EmailParams): string => {
  const { parentName, studentName, studentId, absentDates, totalAbsences } = params;
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <div style="background-color: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">ICCT RFID Attendance System</h1>
        <p style="margin: 5px 0 0 0; font-size: 14px;">Student Attendance Alert</p>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <h2 style="color: #dc2626; margin-top: 0;">⚠️ Attendance Alert: Multiple Absences Detected</h2>
        
        <p>Dear <strong>${parentName}</strong>,</p>
        
        <p>We hope this message finds you well. We are writing to inform you about your child's recent attendance record that requires your attention.</p>
        
        <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="margin-top: 0; color: #dc2626;">Student Information</h3>
          <p><strong>Student Name:</strong> ${studentName}</p>
          <p><strong>Student ID:</strong> ${studentId}</p>
          <p><strong>Total Absences:</strong> ${totalAbsences}</p>
        </div>
        
        <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e40af;">Recent Absence Dates</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            ${absentDates.map(date => `<li>${new Date(date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</li>`).join('')}
          </ul>
        </div>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="margin-top: 0; color: #92400e;">What This Means</h3>
          <p style="margin: 0;">Your child has accumulated <strong>${totalAbsences} absences</strong>, which may impact their academic performance and standing. Regular attendance is crucial for academic success and is required by our institution's policies.</p>
        </div>
        
        <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e40af;">Recommended Actions</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Please discuss with your child the importance of regular attendance</li>
            <li>Contact your child's advisor or the student services office if there are any concerns</li>
            <li>Review and address any underlying issues that may be causing the absences</li>
            <li>Ensure your child understands the academic impact of continued absences</li>
          </ul>
        </div>
        
        <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="margin-top: 0; color: #047857;">Support Available</h3>
          <p style="margin: 0;">If your family is experiencing challenges that are affecting your child's attendance, please don't hesitate to reach out to our student support services. We are here to help and work together to ensure your child's academic success.</p>
        </div>
        
        <p>We appreciate your attention to this matter and your partnership in your child's education. Please feel free to contact us if you have any questions or concerns.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
          <p><strong>ICCT (International Center for Culinary Technology)</strong></p>
          <p>Automated Attendance Management System</p>
          <p style="margin: 5px 0;">This is an automated message from our RFID attendance tracking system.</p>
          <p style="margin: 0;">Please do not reply to this email. For inquiries, contact the student services office.</p>
        </div>
      </div>
    </div>
  `;
};

export const sendParentAbsenceAlert = async (params: EmailParams): Promise<boolean> => {
  try {
    console.log('📧 Sending absence alert email to parent:', params.parentEmail);
    
    // Create a temporary inbox for sending (MailSlurp requirement)
    const inbox = await mailslurp.inboxController.createInboxWithDefaults();
    console.log('📮 Created inbox for sending email:', inbox.id);
    
    const emailContent = generateAbsenceEmailContent(params);
    
    // Send the email with proper request object
    await mailslurp.inboxController.sendEmail(inbox.id, {
      to: [params.parentEmail],
      subject: `🚨 ICCT Attendance Alert - ${params.studentName} (${params.totalAbsences} Absences)`,
      body: emailContent,
      isHTML: true
    });
    
    console.log('✅ Absence alert email sent successfully to:', params.parentEmail);
    
    // Clean up the temporary inbox with proper request object
    await mailslurp.inboxController.deleteInbox(inbox.id);
    console.log('🗑️ Temporary inbox cleaned up');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to send absence alert email:', error);
    return false;
  }
};
