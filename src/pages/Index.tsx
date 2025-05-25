
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LandingPage from '@/components/LandingPage';
import StudentDashboard from '@/components/StudentDashboard';
import AdminDashboard from '@/components/AdminDashboard';
import RFIDRegistrationDialog from '@/components/RFIDRegistrationDialog';
import AdminLoginDialog from '@/components/AdminLoginDialog';
import { RFIDService } from '@/services/RFIDService';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const { user, userType, login } = useAuth();
  const [detectedRFID, setDetectedRFID] = useState<string | null>(null);
  const [showRFIDDialog, setShowRFIDDialog] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [pendingRFID, setPendingRFID] = useState<string | null>(null);

  useEffect(() => {
    const rfidService = RFIDService.getInstance();
    
    const handleRFIDDetection = (rfidId: string) => {
      console.log('RFID detected in Index:', rfidId);
      setDetectedRFID(rfidId);
      setShowRFIDDialog(true);
      
      toast({
        title: "Unknown RFID Detected",
        description: `RFID: ${rfidId.toUpperCase().replace(/(.{2})/g, '$1 ').trim()}`,
        duration: 3000
      });
    };

    rfidService.addListener(handleRFIDDetection);
    rfidService.startMonitoring();

    // Cleanup on unmount
    return () => {
      rfidService.removeListener(handleRFIDDetection);
      rfidService.stopMonitoring();
    };
  }, []);

  const handleLogin = () => {
    console.log('Login successful, redirecting to dashboard...');
  };

  const handleRFIDRegistration = () => {
    console.log('Starting RFID registration process');
    setPendingRFID(detectedRFID);
    setShowRFIDDialog(false);
    setShowAdminLogin(true);
  };

  const handleAdminLoginSuccess = async () => {
    console.log('Admin login successful, switching to admin view');
    setShowAdminLogin(false);
    
    // Auto-login as admin for the registration process
    const loginSuccess = await login('ICCTADMIN01', 'admin123');
    
    if (loginSuccess) {
      // The admin dashboard will handle opening the student registration
      // We'll pass the RFID through a prop or context
      console.log('Admin logged in, RFID ready for registration:', pendingRFID);
    }
  };

  const handleCloseRFIDDialog = () => {
    setShowRFIDDialog(false);
    setDetectedRFID(null);
  };

  const handleCloseAdminLogin = () => {
    setShowAdminLogin(false);
    setPendingRFID(null);
  };

  // Add a test button for simulating RFID detection (for development)
  const simulateUnknownRFID = () => {
    const rfidService = RFIDService.getInstance();
    const testRFID = 'E1A2B3C4'; // Unknown RFID for testing
    rfidService.simulateRFIDDetection(testRFID);
  };

  if (!user) {
    return (
      <>
        <LandingPage onLogin={handleLogin} />
        
        {/* Development testing button */}
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={simulateUnknownRFID}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-sm"
          >
            Test RFID
          </button>
        </div>

        <RFIDRegistrationDialog
          rfidId={detectedRFID || ''}
          isOpen={showRFIDDialog}
          onClose={handleCloseRFIDDialog}
          onRegister={handleRFIDRegistration}
        />

        <AdminLoginDialog
          isOpen={showAdminLogin}
          onClose={handleCloseAdminLogin}
          onSuccess={handleAdminLoginSuccess}
          rfidId={pendingRFID || undefined}
        />
      </>
    );
  }

  if (userType === 'student') {
    return <StudentDashboard />;
  }

  if (userType === 'admin') {
    return (
      <AdminDashboard 
        pendingRFID={pendingRFID}
        onRFIDRegistered={() => {
          setPendingRFID(null);
          // Refresh known RFIDs
          RFIDService.getInstance().refreshKnownRFIDs();
        }}
      />
    );
  }

  return <LandingPage onLogin={handleLogin} />;
};

export default Index;
