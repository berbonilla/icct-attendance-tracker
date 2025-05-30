
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { sendParentAbsenceAlert } from '@/services/parentEmailService';

interface EmailTestPanelProps {
  isConnected: boolean;
}

const EmailTestPanel: React.FC<EmailTestPanelProps> = ({ isConnected }) => {
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  const testEmailFunction = async () => {
    setIsTestingEmail(true);
    
    try {
      console.log('🧪 Testing email function...');
      
      // Test data for email
      const testData = {
        parentEmail: 'test@example.com', // You can change this to your email for testing
        parentName: 'Test Parent',
        studentName: 'Test Student',
        studentId: 'TEST001',
        absentDates: ['2025-05-30', '2025-05-29', '2025-05-28'],
        totalAbsences: 3
      };

      const success = await sendParentAbsenceAlert(testData);
      
      if (success) {
        toast({
          title: "Email Test Successful! ✅",
          description: `Test email sent to ${testData.parentEmail}`,
          duration: 5000
        });
      } else {
        toast({
          title: "Email Test Failed ❌",
          description: "Check console for error details",
          variant: "destructive",
          duration: 5000
        });
      }
    } catch (error) {
      console.error('❌ Email test error:', error);
      toast({
        title: "Email Test Error ❌",
        description: "An error occurred while testing email",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  return (
    <div className="p-4 border border-gray-medium rounded-lg">
      <h3 className="font-semibold mb-2">Email Alert System</h3>
      <p className="text-sm text-gray-dark mb-3">Test the parent absence alert email functionality</p>
      <div className="flex items-center space-x-3">
        <Button 
          onClick={testEmailFunction}
          disabled={!isConnected || isTestingEmail}
          className="bg-dark-blue text-white hover:bg-light-blue"
        >
          <Mail className="w-4 h-4 mr-2" />
          {isTestingEmail ? 'Sending Test Email...' : 'Test Email Function'}
        </Button>
        <Badge variant="outline" className="text-green-600">
          EmailJS Configured ✅
        </Badge>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Will send test email to: test@example.com (change in code if needed)
      </p>
    </div>
  );
};

export default EmailTestPanel;
