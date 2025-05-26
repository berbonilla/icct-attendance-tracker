
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
    <div className="min-h-screen bg-gradient-to-br from-[#2B5AA0] to-[#1E3A72] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            ICCT RFID System
          </h1>
          <p className="text-blue-200 text-lg">
            Student Attendance Management
          </p>
          
          {pendingRFID && (
            <div className="mt-6 p-4 bg-blue-700/50 border border-blue-600 rounded-lg backdrop-blur-sm">
              <p className="text-sm text-blue-100">
                RFID Card Detected: {pendingRFID}
              </p>
            </div>
          )}
        </div>

        {/* Access Card */}
        <Card className="shadow-2xl border-0 bg-white rounded-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-white bg-[#4A90E2] py-2 px-6 rounded-md inline-block mx-auto font-semibold">
              Access System
            </CardTitle>
            <CardDescription className="text-[#4A90E2] font-medium mt-3 text-sm">
              Enter your Student ID (TA202200XXX) or Admin ID
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 px-8 pb-8">
            {!autoAdminMode && (
              <form onSubmit={handleIdSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="id" className="text-gray-800 font-medium text-sm">ID Number</Label>
                  <Input
                    id="id"
                    type="text"
                    placeholder="Enter Student ID or Admin ID"
                    value={idInput}
                    onChange={(e) => setIdInput(e.target.value)}
                    className="h-12 border-gray-300 rounded-md focus:border-[#4A90E2] focus:ring-[#4A90E2] text-gray-700"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-[#1E3A72] hover:bg-[#2B5AA0] text-white font-medium text-sm rounded-md"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Access System
                    </div>
                  ) : (
                    'Access System'
                  )}
                </Button>
              </form>
            )}
            
            {autoAdminMode && (
              <div className="text-center space-y-6">
                <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-blue-800 font-medium">
                    Unregistered RFID detected. Administrator access required.
                  </p>
                </div>
                <Button 
                  onClick={() => setShowPasswordDialog(true)}
                  className="w-full h-12 bg-[#1E3A72] hover:bg-[#2B5AA0] text-white font-medium text-sm rounded-md"
                >
                  Administrator Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Admin Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#1E3A72]">Administrator Authentication</DialogTitle>
            <DialogDescription className="text-[#4A90E2]">
              {pendingRFID 
                ? `Please authenticate to register RFID: ${pendingRFID}`
                : "Enter your administrator credentials"
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-id" className="text-gray-700">Administrator ID</Label>
              <Input
                id="admin-id"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="Enter administrator ID"
                className="border-gray-300 focus:border-[#4A90E2] focus:ring-[#4A90E2]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter administrator password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-gray-300 focus:border-[#4A90E2] focus:ring-[#4A90E2]"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowPasswordDialog(false)}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-[#1E3A72] hover:bg-[#2B5AA0] text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPage;
