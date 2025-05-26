
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Shield, Users, Clock, Star } from 'lucide-react';

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

  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure RFID",
      description: "Advanced RFID technology for accurate attendance tracking"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Multi-User",
      description: "Support for students, teachers, and administrators"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Real-time",
      description: "Instant attendance updates and live monitoring"
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Analytics",
      description: "Comprehensive reporting and attendance insights"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center space-y-6 mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
              <Shield className="w-4 h-4 text-blue-300 mr-2" />
              <span className="text-sm text-white/90 font-medium">Secure • Reliable • Real-time</span>
            </div>
            
            <h1 className={`font-bold text-white leading-tight ${isMobile ? 'text-4xl' : 'text-6xl lg:text-7xl'}`}>
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                ICCT RFID
              </span>
              <br />
              <span className="text-white/90">System</span>
            </h1>
            
            <p className={`text-white/70 max-w-2xl mx-auto leading-relaxed ${isMobile ? 'text-lg' : 'text-xl'}`}>
              Advanced student attendance management with cutting-edge RFID technology. 
              Experience seamless tracking, real-time analytics, and comprehensive reporting.
            </p>

            {pendingRFID && (
              <div className="inline-flex items-center px-6 py-3 bg-amber-500/20 backdrop-blur-sm rounded-lg border border-amber-400/30 animate-pulse">
                <div className="w-2 h-2 bg-amber-400 rounded-full mr-3 animate-ping"></div>
                <span className={`text-amber-200 font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>
                  Unregistered RFID detected: {pendingRFID}
                </span>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div 
                  key={feature.title}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="text-blue-300 mb-3 group-hover:text-blue-200 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* Login Card */}
            <div className="max-w-md mx-auto w-full">
              <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
                <CardHeader className="text-center pb-6">
                  <CardTitle className={`text-white ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                    {autoAdminMode ? 'Admin Authentication Required' : 'Access System'}
                  </CardTitle>
                  <CardDescription className={`text-white/70 ${isMobile ? 'text-sm' : 'text-base'}`}>
                    {autoAdminMode 
                      ? 'Please login as admin to register the new RFID'
                      : 'Enter your Student ID (TA202200XXX) or Admin ID'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className={isMobile ? 'p-4' : 'p-6'}>
                  {!autoAdminMode && (
                    <form onSubmit={handleIdSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="id" className="text-white/90">ID Number</Label>
                        <Input
                          id="id"
                          type="text"
                          placeholder="Enter Student ID or Admin ID"
                          value={idInput}
                          onChange={(e) => setIdInput(e.target.value)}
                          className={`bg-white/10 border-white/30 text-white placeholder-white/50 focus:border-blue-400 focus:ring-blue-400/20 ${isMobile ? 'h-12 text-base' : ''}`}
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${isMobile ? 'h-12 text-base' : ''}`}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                            Accessing...
                          </div>
                        ) : (
                          'Access System'
                        )}
                      </Button>
                    </form>
                  )}
                  
                  {autoAdminMode && (
                    <div className="text-center space-y-4">
                      <div className="p-4 bg-amber-500/20 rounded-lg border border-amber-400/30">
                        <p className={`text-amber-200 ${isMobile ? 'text-sm' : 'text-base'}`}>
                          An unregistered RFID was detected. Admin login required to register new student.
                        </p>
                      </div>
                      <Button 
                        onClick={() => setShowPasswordDialog(true)}
                        className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${isMobile ? 'h-12 text-base' : ''}`}
                      >
                        Admin Login
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className={`bg-slate-900/95 backdrop-blur-xl border-white/20 text-white ${isMobile ? 'w-[95vw] max-w-sm' : 'max-w-lg'}`}>
          <DialogHeader>
            <DialogTitle className={`text-white ${isMobile ? 'text-lg' : 'text-xl'}`}>
              Admin Authentication
            </DialogTitle>
            <DialogDescription className={`text-white/70 ${isMobile ? 'text-sm' : 'text-base'}`}>
              {pendingRFID 
                ? `Please enter admin credentials to register RFID: ${pendingRFID}`
                : "Please enter your password to access the admin dashboard"
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-id" className="text-white/90">Admin ID</Label>
              <Input
                id="admin-id"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="Enter admin ID"
                className={`bg-white/10 border-white/30 text-white placeholder-white/50 focus:border-blue-400 focus:ring-blue-400/20 ${isMobile ? 'h-12 text-base' : ''}`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/90">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`bg-white/10 border-white/30 text-white placeholder-white/50 focus:border-blue-400 focus:ring-blue-400/20 ${isMobile ? 'h-12 text-base' : ''}`}
              />
            </div>
            <div className={`flex gap-3 ${isMobile ? 'flex-col' : ''}`}>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowPasswordDialog(false)}
                className={`bg-white/10 border-white/30 text-white hover:bg-white/20 ${isMobile ? 'w-full h-12' : 'flex-1'}`}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className={`bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 ${isMobile ? 'w-full h-12' : 'flex-1'}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  'Login'
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
