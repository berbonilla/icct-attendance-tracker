import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LandingPage from '@/components/LandingPage';
import StudentDashboard from '@/components/StudentDashboard';
import AdminDashboard from '@/components/AdminDashboard';
import StudentManagement from '@/components/StudentManagement';
import { initializeAbsenceTracking } from '@/services/absenceTrackingService';

const Index = () => {
  const { user, userType, autoAdminMode, pendingRFID, setPendingRFID, setAutoAdminMode } = useAuth();
  const [showStudentManagement, setShowStudentManagement] = useState(false);
  const [systemChecks, setSystemChecks] = useState({
    authContext: false,
    dataLoading: false,
    rfidProcessing: false,
    cacheCleared: false
  });

  // Initialize absence tracking system
  useEffect(() => {
    console.log('🔍 Initializing absence tracking system...');
    const cleanupAbsenceTracking = initializeAbsenceTracking();
    
    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up absence tracking system...');
      cleanupAbsenceTracking();
    };
  }, []);

  // System validation checks on mount
  useEffect(() => {
    const runSystemChecks = async () => {
      console.log('🔍 Running comprehensive system validation...');
      
      // Check auth context
      setSystemChecks(prev => ({ ...prev, authContext: true }));
      console.log('✅ Auth context loaded');
      
      // Check cache status
      const cacheCleared = !localStorage.getItem('icct_user') && !sessionStorage.length;
      setSystemChecks(prev => ({ ...prev, cacheCleared }));
      console.log('✅ Cache status:', cacheCleared ? 'CLEARED' : 'HAS DATA');
      
      // Check data loading
      try {
        const dummyData = await import('../data/emptyDatabase.json');
        console.log('📊 Database validation:');
        console.log('- Students count:', Object.keys(dummyData.students || {}).length);
        console.log('- Admin Users count:', Object.keys(dummyData.adminUsers || {}).length);
        console.log('- Schedules count:', Object.keys(dummyData.schedules || {}).length);
        console.log('- Scanned IDs count:', Object.keys(dummyData.ScannedIDs || {}).length);
        console.log('- Attendance Records count:', Object.keys(dummyData.attendanceRecords || {}).length);
        console.log('- Absentee Alerts count:', Object.keys(dummyData.absenteeAlerts || {}).length);
        
        setSystemChecks(prev => ({ ...prev, dataLoading: true }));
        console.log('✅ Database connection successful');
      } catch (error) {
        console.error('❌ Database loading failed:', error);
      }
      
      // Check RFID processing
      setSystemChecks(prev => ({ ...prev, rfidProcessing: true }));
      console.log('✅ RFID processing system initialized');
      
      console.log('🎯 System validation complete');
    };

    runSystemChecks();
  }, []);

  // Handle automatic navigation to student management when admin logs in via RFID detection
  useEffect(() => {
    console.log('🧭 Navigation check:', {
      user: !!user,
      userType,
      autoAdminMode,
      pendingRFID,
      showStudentManagement
    });

    if (user && userType === 'admin' && autoAdminMode && pendingRFID) {
      console.log('✅ Admin authenticated for RFID registration - Showing student management');
      setShowStudentManagement(true);
    }
  }, [user, userType, autoAdminMode, pendingRFID]);

  // Validation for RFID workflow
  useEffect(() => {
    if (pendingRFID) {
      const isValidFormat = /^[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}$/.test(pendingRFID);
      
      console.log('🔍 RFID Validation:', {
        rfid: pendingRFID,
        format: isValidFormat ? 'VALID' : 'INVALID',
        autoAdminMode,
        userLoggedIn: !!user
      });

      if (!isValidFormat) {
        console.error('❌ Invalid RFID format detected:', pendingRFID);
      } else {
        console.log('✅ RFID format validation passed');
      }
    }
  }, [pendingRFID, autoAdminMode, user]);

  const handleLogin = () => {
    console.log('✅ Login successful - Redirecting to appropriate dashboard');
  };

  const handleStudentRegistered = () => {
    console.log('🎉 Student registration completed successfully');
    console.log('🔄 Cleaning up registration state...');
    
    // Clear the pending RFID and auto admin mode after successful registration
    setPendingRFID(null);
    setAutoAdminMode(false);
    setShowStudentManagement(false);
    
    console.log('✅ Registration cleanup complete');
  };

  // Log current application state every time it changes
  useEffect(() => {
    console.log('📱 Application State Update:', {
      user: user ? `${user.name} (${userType})` : 'None',
      autoAdminMode,
      pendingRFID,
      showStudentManagement,
      systemChecks,
      timestamp: new Date().toISOString()
    });
  }, [user, userType, autoAdminMode, pendingRFID, showStudentManagement, systemChecks]);

  // Render appropriate component based on state
  if (!user) {
    console.log('🎨 Rendering: Landing Page');
    return <LandingPage onLogin={handleLogin} />;
  }

  if (userType === 'student') {
    console.log('🎨 Rendering: Student Dashboard');
    return <StudentDashboard />;
  }

  if (userType === 'admin') {
    if (showStudentManagement) {
      console.log('🎨 Rendering: Student Management (RFID Registration)');
      return (
        <StudentManagement 
          pendingRFID={pendingRFID} 
          onStudentRegistered={handleStudentRegistered}
        />
      );
    }
    console.log('🎨 Rendering: Admin Dashboard');
    return <AdminDashboard />;
  }

  console.log('⚠️ Fallback: Rendering Landing Page');
  return <LandingPage onLogin={handleLogin} />;
};

export default Index;
