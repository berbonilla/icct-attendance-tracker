import React, { createContext, useContext, useState, useEffect } from 'react';
import { database } from '@/config/firebase';
import { ref, onValue, off } from 'firebase/database';
import { processAttendance } from '@/services/attendanceService';

// Type definitions for the database structure
interface ScannedID {
  timestamp: number;
  processed: boolean;
}

interface Student {
  name: string;
  rfid: string;
  email: string;
  course: string;
  year: string;
  section: string;
}

interface AdminUser {
  name: string;
  password: string;
  role: string;
  email: string;
}

interface DatabaseData {
  ScannedIDs: Record<string, ScannedID>;
  students: Record<string, Student>;
  adminUsers: Record<string, AdminUser>;
  schedules: Record<string, any>;
  attendanceRecords: Record<string, any>;
  absenteeAlerts: Record<string, any>;
}

interface AuthContextType {
  user: any;
  userType: 'student' | 'admin' | null;
  login: (id: string, password?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  pendingRFID: string | null;
  setPendingRFID: (rfid: string | null) => void;
  autoAdminMode: boolean;
  setAutoAdminMode: (mode: boolean) => void;
  systemReset: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [userType, setUserType] = useState<'student' | 'admin' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingRFID, setPendingRFID] = useState<string | null>(null);
  const [autoAdminMode, setAutoAdminMode] = useState(false);
  const [processedRFIDs, setProcessedRFIDs] = useState<Set<string>>(new Set());
  const [databaseData, setDatabaseData] = useState<DatabaseData | null>(null);

  // System reset function to clear all states
  const systemReset = () => {
    console.log('🔄 System Reset: Clearing all states and cache');
    
    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Reset all states
    setUser(null);
    setUserType(null);
    setPendingRFID(null);
    setAutoAdminMode(false);
    setProcessedRFIDs(new Set());
    setIsLoading(false);
    
    console.log('✅ System Reset: All states cleared');
  };

  // Initialize Firebase connection and listen to database changes
  useEffect(() => {
    console.log('🚀 Application Starting: Connecting to Firebase Database');
    console.log('🔗 Firebase URL:', 'https://icct-rfid-system-default-rtdb.asia-southeast1.firebasedatabase.app/');
    
    systemReset();
    
    // Set up real-time listener for the entire database
    const dbRef = ref(database);
    
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      console.log('🔥 Firebase Database Updated:', data);
      
      if (data) {
        setDatabaseData(data);
        console.log('📊 Database State:', {
          scannedIDs: Object.keys(data.ScannedIDs || {}).length,
          students: Object.keys(data.students || {}).length,
          adminUsers: Object.keys(data.adminUsers || {}).length
        });
      } else {
        console.log('📊 Database is empty');
        setDatabaseData(null);
      }
    }, (error) => {
      console.error('❌ Firebase Database Error:', error);
    });

    return () => {
      off(dbRef);
      unsubscribe();
    };
  }, []);

  // Monitor ScannedIDs for automatic RFID detection
  useEffect(() => {
    if (!databaseData || !databaseData.ScannedIDs) {
      console.log('💤 No ScannedIDs to process');
      return;
    }

    console.log('🔍 RFID Scanner: Processing ScannedIDs from Firebase...');
    console.log('🆔 Found ScannedIDs:', databaseData.ScannedIDs);
    
    // Find the earliest unprocessed RFID that hasn't been processed locally
    const unprocessedRFIDs = Object.entries(databaseData.ScannedIDs)
      .filter(([rfid, data]) => !data.processed && !processedRFIDs.has(rfid))
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    console.log('🔍 Unprocessed RFIDs found:', unprocessedRFIDs.length);

    if (unprocessedRFIDs.length > 0) {
      const [earliestRFID, data] = unprocessedRFIDs[0];
      console.log('⚡ Processing RFID:', earliestRFID, 'at timestamp:', data.timestamp);
      
      // Mark as processed locally to avoid reprocessing
      setProcessedRFIDs(prev => new Set([...prev, earliestRFID]));
      
      // Check if RFID is registered in students database
      const isRegistered = databaseData.students && Object.values(databaseData.students).some(
        student => student.rfid === earliestRFID
      );
      
      console.log('🔐 RFID Status:', isRegistered ? 'REGISTERED' : 'UNREGISTERED');
      console.log('🔍 Checking RFID against students:', {
        scannedRFID: earliestRFID,
        studentRFIDs: Object.values(databaseData.students || {}).map(s => s.rfid),
        isRegistered
      });
      
      if (!isRegistered) {
        console.log('🚨 Unregistered RFID detected - Triggering admin authentication');
        setPendingRFID(earliestRFID);
        setAutoAdminMode(true);
      } else {
        console.log('✅ RFID is registered - Processing attendance');
        
        // Find the student ID for this RFID
        const studentEntry = Object.entries(databaseData.students || {}).find(
          ([, student]) => student.rfid === earliestRFID
        );
        
        if (studentEntry) {
          const [studentId] = studentEntry;
          console.log('📋 Processing attendance for student ID:', studentId);
          
          // Process attendance asynchronously
          processAttendance(studentId, data.timestamp).catch(error => {
            console.error('❌ Failed to process attendance:', error);
          });
        }
      }
    }
  }, [databaseData, processedRFIDs]);

  const loadUserData = async (id: string, password?: string) => {
    setIsLoading(true);
    console.log('🔐 Authentication attempt for:', id);
    
    try {
      if (!databaseData) {
        console.log('❌ Database not loaded yet');
        return false;
      }
      
      if (id.startsWith('TA')) {
        const student = databaseData.students && databaseData.students[id];
        if (student) {
          console.log('✅ Student authentication successful');
          setUser({ id, ...student });
          setUserType('student');
          return true;
        } else {
          console.log('❌ Student not found');
        }
      } else {
        const admin = databaseData.adminUsers && databaseData.adminUsers[id];
        if (admin && password === admin.password) {
          console.log('✅ Admin authentication successful');
          setUser({ id, ...admin });
          setUserType('admin');
          return true;
        } else {
          console.log('❌ Admin authentication failed');
        }
      }
      
      return false;
    } catch (error) {
      console.error('❌ Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (id: string, password?: string): Promise<boolean> => {
    return await loadUserData(id, password);
  };

  const logout = () => {
    console.log('🚪 Admin logout - performing system reset and returning to landing page');
    
    // Perform system reset to clear all states
    systemReset();
    
    // Force a re-render by ensuring user state is null
    setUser(null);
    setUserType(null);
    
    console.log('✅ Logout complete - user should see landing page');
  };

  const value = {
    user,
    userType,
    login,
    logout,
    isLoading,
    pendingRFID,
    setPendingRFID,
    autoAdminMode,
    setAutoAdminMode,
    systemReset
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
