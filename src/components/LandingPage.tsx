
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface LandingPageProps {
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [idInput, setIdInput] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [adminId, setAdminId] = useState('');
  const { login, isLoading, autoAdminMode, pendingRFID } = useAuth();
  const isMobile = useIsMobile();

  // Auto-open admin login when RFID detection triggers it
  useEffect(() => {
    if (autoAdminMode && pendingRFID) {
      setShowPasswordDialog(true);
    }
  }, [autoAdminMode, pendingRFID]);

  const handleIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!idInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid ID",
        variant: "destructive"
      });
      return;
    }

    if (idInput.startsWith('TA')) {
      const success = await login(idInput);
      if (success) {
        toast({
          title: "Success",
          description: "Student login successful"
        });
        onLogin();
      } else {
        toast({
          title: "Error",
          description: "Student ID not found",
          variant: "destructive"
        });
      }
    } else {
      setAdminId(idInput);
      setShowPasswordDialog(true);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await login(adminId, password);
    if (success) {
      toast({
        title: "Success",
        description: "Admin login successful"
      });
      setShowPasswordDialog(false);
      setPassword('');
      onLogin();
    } else {
      toast({
        title: "Error",
        description: "Invalid admin credentials",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-blue to-light-blue flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className={`font-bold text-white ${isMobile ? 'text-2xl' : 'text-4xl'}`}>
            ICCT RFID System
          </h1>
          <p className={`text-gray-light ${isMobile ? 'text-sm' : 'text-base'}`}>
            Student Attendance Management
          </p>
          {pendingRFID && (
            <p className={`text-yellow-300 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              Unregistered RFID detected: {pendingRFID}
            </p>
          )}
        </div>

        {/* Main Login Card */}
        <Card className="bg-white shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className={`text-dark-blue ${isMobile ? 'text-xl' : 'text-2xl'}`}>
              {autoAdminMode ? 'Admin Authentication Required' : 'Access System'}
            </CardTitle>
            <CardDescription className={isMobile ? 'text-sm' : 'text-base'}>
              {autoAdminMode 
                ? 'Please login as admin to register the new RFID'
                : 'Enter your Student ID (TA202200XXX) or Admin ID'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className={isMobile ? 'p-4' : 'p-6'}>
            {!autoAdminMode && (
              <form onSubmit={handleIdSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="id" className="text-dark-blue">ID Number</Label>
                  <Input
                    id="id"
                    type="text"
                    placeholder="Enter Student ID or Admin ID"
                    value={idInput}
                    onChange={(e) => setIdInput(e.target.value)}
                    className={`border-gray-medium focus:border-light-blue ${isMobile ? 'h-12 text-base' : ''}`}
                  />
                </div>
                <Button 
                  type="submit" 
                  className={`w-full bg-dark-blue hover:bg-light-blue text-white ${isMobile ? 'h-12 text-base' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Accessing...' : 'Access System'}
                </Button>
              </form>
            )}
            
            {autoAdminMode && (
              <div className="text-center">
                <p className={`text-gray-600 mb-4 ${isMobile ? 'text-sm' : 'text-base'}`}>
                  An unregistered RFID was detected. Admin login required to register new student.
                </p>
                <Button 
                  onClick={() => setShowPasswordDialog(true)}
                  className={`w-full bg-dark-blue hover:bg-light-blue text-white ${isMobile ? 'h-12 text-base' : ''}`}
                >
                  Admin Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Admin Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className={`bg-white ${isMobile ? 'w-[95vw] max-w-sm' : 'max-w-lg'}`}>
          <DialogHeader>
            <DialogTitle className={`text-dark-blue ${isMobile ? 'text-lg' : 'text-xl'}`}>
              Admin Authentication
            </DialogTitle>
            <DialogDescription className={isMobile ? 'text-sm' : 'text-base'}>
              {pendingRFID 
                ? `Please enter admin credentials to register RFID: ${pendingRFID}`
                : "Please enter your password to access the admin dashboard"
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-id" className="text-dark-blue">Admin ID</Label>
              <Input
                id="admin-id"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="Enter admin ID"
                className={`border-gray-medium focus:border-light-blue ${isMobile ? 'h-12 text-base' : ''}`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-dark-blue">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`border-gray-medium focus:border-light-blue ${isMobile ? 'h-12 text-base' : ''}`}
              />
            </div>
            <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'space-x-2'}`}>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowPasswordDialog(false)}
                className={`${isMobile ? 'w-full h-12' : 'flex-1'}`}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className={`bg-dark-blue hover:bg-light-blue text-white ${isMobile ? 'w-full h-12' : 'flex-1'}`}
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : 'Login'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPage;
