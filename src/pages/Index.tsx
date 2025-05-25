
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LandingPage from '@/components/LandingPage';
import StudentDashboard from '@/components/StudentDashboard';
import AdminDashboard from '@/components/AdminDashboard';
import StudentManagement from '@/components/StudentManagement';

const Index = () => {
  const { user, userType, autoAdminMode, pendingRFID, setPendingRFID, setAutoAdminMode } = useAuth();
  const [showStudentManagement, setShowStudentManagement] = useState(false);

  // Handle automatic navigation to student management when admin logs in via RFID detection
  useEffect(() => {
    if (user && userType === 'admin' && autoAdminMode && pendingRFID) {
      console.log('Admin logged in via RFID detection, showing student management');
      setShowStudentManagement(true);
    }
  }, [user, userType, autoAdminMode, pendingRFID]);

  const handleLogin = () => {
    console.log('Login successful, redirecting to dashboard...');
  };

  const handleStudentRegistered = () => {
    // Clear the pending RFID and auto admin mode after successful registration
    setPendingRFID(null);
    setAutoAdminMode(false);
    setShowStudentManagement(false);
  };

  if (!user) {
    return <LandingPage onLogin={handleLogin} />;
  }

  if (userType === 'student') {
    return <StudentDashboard />;
  }

  if (userType === 'admin') {
    if (showStudentManagement) {
      return (
        <StudentManagement 
          pendingRFID={pendingRFID} 
          onStudentRegistered={handleStudentRegistered}
        />
      );
    }
    return <AdminDashboard />;
  }

  return <LandingPage onLogin={handleLogin} />;
};

export default Index;
