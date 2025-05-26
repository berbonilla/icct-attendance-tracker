
import React, { createContext, useContext, useState, useEffect } from 'react';

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

  // Initialize system on mount - clear cache and reset
  useEffect(() => {
    console.log('🚀 Application Starting: Performing initial system reset');
    systemReset();
    
    // Log system initialization
    console.log('📊 System Status Check:');
    console.log('- Cache cleared:', !localStorage.getItem('icct_user'));
    console.log('- States reset:', !user && !userType && !pendingRFID && !autoAdminMode);
    console.log('- Ready for fresh start');
  }, []);

  // Monitor ScannedIDs for automatic RFID detection every 5 seconds
  useEffect(() => {
    const checkScannedRFIDs = async () => {
      try {
        console.log('🔍 RFID Scanner: Checking for new scans...');
        const dummyDataModule = await import('../data/emptyDatabase.json');
        const dummyData = dummyDataModule.default as DatabaseData;
        
        console.log('📋 Database State:', {
          scannedIDs: Object.keys(dummyData.ScannedIDs || {}).length,
          students: Object.keys(dummyData.students || {}).length,
          adminUsers: Object.keys(dummyData.adminUsers || {}).length
        });
        
        // Only proceed if ScannedIDs exists and has unprocessed content
        if (dummyData.ScannedIDs && Object.keys(dummyData.ScannedIDs).length > 0) {
          console.log('🆔 Found ScannedIDs:', dummyData.ScannedIDs);
          
          // Find the earliest unprocessed RFID that hasn't been processed locally
          const unprocessedRFIDs = Object.entries(dummyData.ScannedIDs)
            .filter(([rfid, data]) => !data.processed && !processedRFIDs.has(rfid))
            .sort(([, a], [, b]) => a.timestamp - b.timestamp);

          console.log('🔍 Unprocessed RFIDs found:', unprocessedRFIDs.length);

          if (unprocessedRFIDs.length > 0) {
            const [earliestRFID, data] = unprocessedRFIDs[0];
            console.log('⚡ Processing RFID:', earliestRFID, 'at timestamp:', data.timestamp);
            
            // Mark as processed locally to avoid reprocessing
            setProcessedRFIDs(prev => new Set([...prev, earliestRFID]));
            
            // Check if RFID is registered in students database
            const isRegistered = dummyData.students && Object.values(dummyData.students).some(
              student => student.rfid === earliestRFID
            );
            
            console.log('🔐 RFID Status:', isRegistered ? 'REGISTERED' : 'UNREGISTERED');
            
            if (!isRegistered) {
              console.log('🚨 Unregistered RFID detected - Triggering admin authentication');
              setPendingRFID(earliestRFID);
              setAutoAdminMode(true);
            } else {
              console.log('✅ RFID is registered - Processing attendance');
              // TODO: Add attendance processing logic here
            }
          }
        } else {
          console.log('💤 No ScannedIDs to process');
          // Reset admin mode if no pending RFIDs and no scanned IDs
          if (autoAdminMode && !pendingRFID) {
            console.log('🔄 Resetting admin mode - no pending operations');
            setAutoAdminMode(false);
          }
        }
      } catch (error) {
        console.error('❌ Error checking scanned RFIDs:', error);
      }
    };

    // Initial check after 1 second delay
    const initialTimeout = setTimeout(checkScannedRFIDs, 1000);
    
    // Check for new RFIDs every 5 seconds
    const interval = setInterval(checkScannedRFIDs, 5000);
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [processedRFIDs, autoAdminMode, pendingRFID]);

  const loadUserData = async (id: string, password?: string) => {
    setIsLoading(true);
    console.log('🔐 Authentication attempt for:', id);
    
    try {
      const dummyDataModule = await import('../data/emptyDatabase.json');
      const dummyData = dummyDataModule.default as DatabaseData;
      
      if (id.startsWith('TA')) {
        const student = dummyData.students[id];
        if (student) {
          console.log('✅ Student authentication successful');
          setUser({ id, ...student });
          setUserType('student');
          return true;
        } else {
          console.log('❌ Student not found');
        }
      } else {
        const admin = dummyData.adminUsers[id];
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
    console.log('🚪 User logout - performing system reset');
    systemReset();
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
