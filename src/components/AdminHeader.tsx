
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const AdminHeader: React.FC = () => {
  const { user: currentUser, logout } = useAuth();

  return (
    <div className="bg-dark-blue text-white p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">ICCT RFID System</h1>
          <p className="text-gray-light">Admin Portal</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="font-semibold">{currentUser?.email}</p>
            <p className="text-sm text-gray-light">Administrator</p>
          </div>
          <Button 
            onClick={logout}
            variant="outline"
            className="bg-transparent border-white text-white hover:bg-white hover:text-dark-blue"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;
