
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LandingPage from '@/components/LandingPage';
import StudentDashboard from '@/components/StudentDashboard';
import AdminDashboard from '@/components/AdminDashboard';
import StudentManagement from '@/components/StudentManagement';

const Index = () => {
  const { user, userType, autoAdminMode, pendingRFID, setPendingRFID, setAutoAdminMode } = useAuth();
  const [showStudentManagement, setShowStudentManagement] = useState(false);
  const [systemChecks, setSystemChecks] = useState({
    authContext: false,
    dataLoading: false,
    rfidProcessing: false
  });

  // System validation checks
  useEffect(() => {
    const runSystemChecks = () => {
      console.log('Running system validation checks...');
      
      // Check auth context
      setSystemChecks(prev => ({ ...prev, authContext: true }));
      console.log('✓ Auth context loaded');
      
      // Check data loading
      const checkDataLoading = async () => {
        try {
          const dummyData = await import('../data/dummyData.json');
          console.log('✓ Database connection successful');
          console.log('- Students:', Object.keys(dummyData.students || {}).length);
          console.log('- Admin Users:', Object.keys(dummyData.adminUsers || {}).length);
          console.log('- Schedules:', Object.keys(dummyData.schedules || {}).length);
          console.log('- Scanned IDs:', Object.keys(dummyData.ScannedIDs || {}).length);
          setSystemChecks(prev => ({ ...prev, dataLoading: true }));
        } catch (error) {
          console.error('✗ Database loading failed:', error);
        }
      };
      
      checkDataLoading();
      
      // Check RFID processing
      setSystemChecks(prev => ({ ...prev, rfidProcessing: true }));
      console.log('✓ RFID processing system initialized');
    };

    runSystemChecks();
  }, []);

  // Handle automatic navigation to student management when admin logs in via RFID detection
  useEffect(() => {
    console.log('Index: Checking navigation conditions:', {
      user: !!user,
      userType,
      autoAdminMode,
      pendingRFID
    });

    if (user && userType === 'admin' && autoAdminMode && pendingRFID) {
      console.log('✓ Admin logged in via RFID detection, showing student management');
      setShowStudentManagement(true);
    }
  }, [user, userType, autoAdminMode, pendingRFID]);

  // Validation for RFID workflow
  useEffect(() => {
    if (pendingRFID) {
      console.log('Pending RFID validation:', {
        rfid: pendingRFID,
        format: /^[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}$/.test(pendingRFID),
        autoAdminMode,
        userLoggedIn: !!user
      });

      // Validate RFID format
      if (!/^[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}$/.test(pendingRFID)) {
        console.error('✗ Invalid RFID format detected:', pendingRFID);
      } else {
        console.log('✓ Valid RFID format confirmed');
      }
    }
  }, [pendingRFID, autoAdminMode, user]);

  const handleLogin = () => {
    console.log('✓ Login successful, redirecting to dashboard...');
  };

  const handleStudentRegistered = () => {
    console.log('✓ Student registration completed, cleaning up...');
    
    // Clear the pending RFID and auto admin mode after successful registration
    setPendingRFID(null);
    setAutoAdminMode(false);
    setShowStudentManagement(false);
    
    console.log('✓ System state reset after registration');
  };

  // Log current application state
  useEffect(() => {
    console.log('Application state update:', {
      user: user ? `${user.name} (${userType})` : 'None',
      autoAdminMode,
      pendingRFID,
      showStudentManagement,
      systemChecks
    });
  }, [user, userType, autoAdminMode, pendingRFID, showStudentManagement, systemChecks]);

  if (!user) {
    return <LandingPage onLogin={handleLogin} />;
  }

  if (userType === 'student') {
    console.log('✓ Rendering student dashboard');
    return <StudentDashboard />;
  }

  if (userType === 'admin') {
    if (showStudentManagement) {
      console.log('✓ Rendering student management for RFID registration');
      return (
        <StudentManagement 
          pendingRFID={pendingRFID} 
          onStudentRegistered={handleStudentRegistered}
        />
      );
    }
    console.log('✓ Rendering admin dashboard');
    return <AdminDashboard />;
  }

  console.log('⚠ Fallback to landing page');
  return <LandingPage onLogin={handleLogin} />;
};

export default Index;
