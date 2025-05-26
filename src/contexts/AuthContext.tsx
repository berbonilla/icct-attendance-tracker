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

  // Monitor ScannedIDs for automatic RFID detection
  useEffect(() => {
    const checkScannedRFIDs = async () => {
      try {
        const dummyData = await import('../data/dummyData.json');
        
        if (dummyData.ScannedIDs) {
          // Find the earliest unprocessed RFID
          const unprocessedRFIDs = Object.entries(dummyData.ScannedIDs)
            .filter(([rfid, data]) => !data.processed && !processedRFIDs.has(rfid))
            .sort(([, a], [, b]) => a.timestamp - b.timestamp);

          if (unprocessedRFIDs.length > 0) {
            const [earliestRFID, data] = unprocessedRFIDs[0];
            console.log('Processing earliest unprocessed RFID:', earliestRFID, 'timestamp:', data.timestamp);
            
            // Mark as processed locally to avoid reprocessing
            setProcessedRFIDs(prev => new Set([...prev, earliestRFID]));
            
            // Check if RFID is registered in students database
            const isRegistered = Object.values(dummyData.students).some(
              student => student.rfid === earliestRFID
            );
            
            if (!isRegistered) {
              console.log('Unregistered RFID detected, triggering admin mode');
              setPendingRFID(earliestRFID);
              setAutoAdminMode(true);
            } else {
              console.log('RFID is registered:', earliestRFID);
            }
          }
        }
      } catch (error) {
        console.error('Error checking scanned RFIDs:', error);
      }
    };

    checkScannedRFIDs();
    
    // Check for new RFIDs every 1 second
    const interval = setInterval(checkScannedRFIDs, 1000);
    
    return () => clearInterval(interval);
  }, [processedRFIDs]);

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

  useEffect(() => {
    // Check for stored session (optional)
    const storedUser = localStorage.getItem('icct_user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData.user);
      setUserType(userData.userType);
    }
  }, []);

  useEffect(() => {
    // Store session (optional)
    if (user && userType) {
      localStorage.setItem('icct_user', JSON.stringify({ user, userType }));
    } else {
      localStorage.removeItem('icct_user');
    }
  }, [user, userType]);

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
