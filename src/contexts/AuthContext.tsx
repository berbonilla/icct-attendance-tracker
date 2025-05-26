
import React, { createContext, useContext, useState, useEffect } from 'react';

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

  // Monitor ScannedIDs for automatic RFID detection every 5 seconds
  useEffect(() => {
    const checkScannedRFIDs = async () => {
      try {
        const dummyData = await import('../data/dummyData.json');
        
        console.log('Checking ScannedIDs...', dummyData.ScannedIDs);
        
        // Only proceed if ScannedIDs exists and has unprocessed content
        if (dummyData.ScannedIDs && Object.keys(dummyData.ScannedIDs).length > 0) {
          // Find the earliest unprocessed RFID that hasn't been processed locally
          const unprocessedRFIDs = Object.entries(dummyData.ScannedIDs)
            .filter(([rfid, data]) => !data.processed && !processedRFIDs.has(rfid))
            .sort(([, a], [, b]) => a.timestamp - b.timestamp);

          console.log('Unprocessed RFIDs found:', unprocessedRFIDs);

          if (unprocessedRFIDs.length > 0) {
            const [earliestRFID, data] = unprocessedRFIDs[0];
            console.log('Processing earliest unprocessed RFID:', earliestRFID, 'timestamp:', data.timestamp);
            
            // Mark as processed locally to avoid reprocessing
            setProcessedRFIDs(prev => new Set([...prev, earliestRFID]));
            
            // Check if RFID is registered in students database
            const isRegistered = dummyData.students && Object.values(dummyData.students).some(
              student => student.rfid === earliestRFID
            );
            
            console.log('RFID registration status:', isRegistered ? 'registered' : 'unregistered');
            
            if (!isRegistered) {
              console.log('Unregistered RFID detected, triggering admin mode');
              setPendingRFID(earliestRFID);
              setAutoAdminMode(true);
            } else {
              console.log('RFID is registered, processing attendance for:', earliestRFID);
              // TODO: Add attendance processing logic here
            }
          }
        } else {
          console.log('No ScannedIDs found or all processed');
          // Reset admin mode if no pending RFIDs and no scanned IDs
          if (autoAdminMode && !pendingRFID) {
            console.log('Resetting admin mode - no pending RFIDs');
            setAutoAdminMode(false);
          }
        }
      } catch (error) {
        console.error('Error checking scanned RFIDs:', error);
      }
    };

    // Initial check
    checkScannedRFIDs();
    
    // Check for new RFIDs every 5 seconds
    const interval = setInterval(checkScannedRFIDs, 5000);
    
    return () => clearInterval(interval);
  }, [processedRFIDs, autoAdminMode, pendingRFID]);

  const loadUserData = async (id: string, password?: string) => {
    setIsLoading(true);
    
    try {
      const dummyData = await import('../data/dummyData.json');
      
      if (id.startsWith('TA')) {
        const student = dummyData.students[id as keyof typeof dummyData.students];
        if (student) {
          setUser({ id, ...student });
          setUserType('student');
          return true;
        }
      } else {
        const admin = dummyData.adminUsers[id as keyof typeof dummyData.adminUsers];
        if (admin && password === admin.password) {
          setUser({ id, ...admin });
          setUserType('admin');
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (id: string, password?: string): Promise<boolean> => {
    return await loadUserData(id, password);
  };

  const logout = () => {
    setUser(null);
    setUserType(null);
    setPendingRFID(null);
    setAutoAdminMode(false);
    setProcessedRFIDs(new Set());
  };

  // Clear session storage on logout and populate on login
  useEffect(() => {
    if (user && userType) {
      localStorage.setItem('icct_user', JSON.stringify({ user, userType }));
    } else {
      localStorage.removeItem('icct_user');
    }
  }, [user, userType]);

  // Load session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('icct_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData.user);
        setUserType(userData.userType);
      } catch (error) {
        console.error('Error loading stored user:', error);
        localStorage.removeItem('icct_user');
      }
    }
  }, []);

  const value = {
    user,
    userType,
    login,
    logout,
    isLoading,
    pendingRFID,
    setPendingRFID,
    autoAdminMode,
    setAutoAdminMode
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
