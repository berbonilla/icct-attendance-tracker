
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LandingPage from '@/components/LandingPage';
import StudentDashboard from '@/components/StudentDashboard';
import AdminDashboard from '@/components/AdminDashboard';

const Index = () => {
  const { user, userType } = useAuth();

  const handleLogin = () => {
    console.log('Login successful, redirecting to dashboard...');
  };

  if (!user) {
    return <LandingPage onLogin={handleLogin} />;
  }

  if (userType === 'student') {
    return <StudentDashboard />;
  }

  if (userType === 'admin') {
    return <AdminDashboard />;
  }

  return <LandingPage onLogin={handleLogin} />;
};

export default Index;
