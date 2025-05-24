
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: any;
  userType: 'student' | 'admin' | null;
  login: (id: string, password?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
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

  // Load dummy data (in real app, this would be from Firebase)
  const loadUserData = async (id: string, password?: string) => {
    // Simulate API call
    setIsLoading(true);
    
    try {
      // Import dummy data
      const dummyData = await import('../data/dummyData.json');
      
      // Check if it's a student ID
      if (id.startsWith('TA')) {
        const student = dummyData.students[id as keyof typeof dummyData.students];
        if (student) {
          setUser({ id, ...student });
          setUserType('student');
          return true;
        }
      } else {
        // Check if it's an admin ID
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
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
