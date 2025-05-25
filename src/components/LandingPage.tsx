
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface LandingPageProps {
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [idInput, setIdInput] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [adminId, setAdminId] = useState('');
  const { login, isLoading, autoAdminMode, pendingRFID } = useAuth();

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
    <div className="min-h-screen bg-gradient-to-br from-dark-blue to-light-blue flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">ICCT RFID System</h1>
          <p className="text-gray-light">Student Attendance Management</p>
          {pendingRFID && (
            <p className="text-yellow-300 text-sm">
              Unregistered RFID detected: {pendingRFID}
            </p>
          )}
        </div>

        {/* Main Login Card */}
        <Card className="bg-white shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-dark-blue">
              {autoAdminMode ? 'Admin Authentication Required' : 'Access System'}
            </CardTitle>
            <CardDescription>
              {autoAdminMode 
                ? 'Please login as admin to register the new RFID'
                : 'Enter your Student ID (TA202200XXX) or Admin ID'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                    className="border-gray-medium focus:border-light-blue"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-dark-blue hover:bg-light-blue text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Accessing...' : 'Access System'}
                </Button>
              </form>
            )}
            
            {autoAdminMode && (
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  An unregistered RFID was detected. Admin login required to register new student.
                </p>
                <Button 
                  onClick={() => setShowPasswordDialog(true)}
                  className="w-full bg-dark-blue hover:bg-light-blue text-white"
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
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-dark-blue">Admin Authentication</DialogTitle>
            <DialogDescription>
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
                className="border-gray-medium focus:border-light-blue"
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
                className="border-gray-medium focus:border-light-blue"
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowPasswordDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-dark-blue hover:bg-light-blue text-white"
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
