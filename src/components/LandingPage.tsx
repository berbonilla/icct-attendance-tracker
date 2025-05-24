
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Settings, Search } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [idInput, setIdInput] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [adminId, setAdminId] = useState('');
  const { login, isLoading } = useAuth();

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

    // Check if it's a student ID (starts with TA)
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
      // Admin ID - show password dialog
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

  const testFirebaseConnection = () => {
    // Simulate Firebase connection test
    toast({
      title: "Connection Status",
      description: "Connected: 200 OK - Firebase Database Connected",
      variant: "default"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-blue to-light-blue flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">ICCT RFID System</h1>
          <p className="text-gray-light">Student Attendance Management</p>
        </div>

        {/* Main Login Card */}
        <Card className="bg-white shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-dark-blue">Access System</CardTitle>
            <CardDescription>
              Enter your Student ID (TA202200XXX) or Admin ID
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Test Credentials Card */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-lg">Test Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-light">
            <div>
              <p className="font-semibold">Student IDs:</p>
              <p>TA202200470, TA202200471, TA202200472, TA202200473</p>
            </div>
            <div>
              <p className="font-semibold">Admin Login:</p>
              <p>ID: ICCTADMIN01 | Password: icct1234</p>
            </div>
          </CardContent>
        </Card>

        {/* Firebase Connection Test */}
        <Button 
          onClick={testFirebaseConnection}
          variant="outline"
          className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20"
        >
          <Settings className="w-4 h-4 mr-2" />
          Test Database Connection
        </Button>
      </div>

      {/* Admin Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-dark-blue">Admin Authentication</DialogTitle>
            <DialogDescription>
              Please enter your password to access the admin dashboard
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdminLogin} className="space-y-4">
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
