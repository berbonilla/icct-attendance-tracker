
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Shield, Eye, EyeOff } from 'lucide-react';

interface AdminLoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  rfidId?: string;
}

const AdminLoginDialog: React.FC<AdminLoginDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  rfidId
}) => {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!adminId || !password) {
      toast({
        title: "Error",
        description: "Please enter both Admin ID and password",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const dummyData = await import('../data/dummyData.json');
      const admin = dummyData.adminUsers[adminId as keyof typeof dummyData.adminUsers];
      
      if (admin && admin.password === password) {
        toast({
          title: "Login Successful",
          description: `Welcome, ${admin.name}`
        });
        
        // Clear form
        setAdminId('');
        setPassword('');
        
        onSuccess();
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid Admin ID or password",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "Failed to authenticate. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-dark-blue flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Admin Authentication Required
          </DialogTitle>
          <DialogDescription>
            {rfidId 
              ? `Please authenticate to register RFID: ${rfidId.toUpperCase().replace(/(.{2})/g, '$1 ').trim()}`
              : "Please enter your admin credentials to continue"
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-id">Admin ID</Label>
            <Input
              id="admin-id"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter admin ID"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <div className="relative">
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter password"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="flex space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogin}
              className="flex-1 bg-dark-blue hover:bg-light-blue text-white"
              disabled={isLoading}
            >
              {isLoading ? "Authenticating..." : "Login"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminLoginDialog;
