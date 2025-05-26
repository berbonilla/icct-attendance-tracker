
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { GraduationCap, Users, BookOpen, School } from 'lucide-react';

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
      icon: <GraduationCap className="w-8 h-8" />,
      title: "Smart Attendance",
      description: "Automated attendance tracking with advanced RFID technology for accurate student monitoring"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Student Management",
      description: "Comprehensive student database with course, year, and section organization"
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Schedule Integration",
      description: "Synchronized class schedules with real-time attendance correlation"
    },
    {
      icon: <School className="w-8 h-8" />,
      title: "Academic Analytics",
      description: "Detailed attendance reports and insights for improved academic outcomes"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-school-light-gray via-white to-school-light-blue/20 relative overflow-hidden">
      {/* Educational background pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-school-blue/10 rounded-full blur-2xl animate-educational-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-school-green/10 rounded-full blur-2xl animate-educational-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-school-gold/10 rounded-full blur-2xl animate-educational-pulse delay-500"></div>
        
        {/* Academic grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-12 gap-4 h-full">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="bg-school-navy rounded-sm"></div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center space-y-8 mb-16">
            <div className="inline-flex items-center px-6 py-3 bg-white/90 backdrop-blur-sm rounded-full border border-school-blue/20 shadow-sm mb-6 animate-slide-up">
              <School className="w-5 h-5 text-school-blue mr-3" />
              <span className="text-sm text-school-navy font-semibold">Secure • Efficient • Educational</span>
            </div>
            
            <div className="space-y-4 animate-slide-up">
              <h1 className={`font-bold text-school-navy leading-tight ${isMobile ? 'text-4xl' : 'text-6xl lg:text-7xl'}`}>
                <span className="bg-gradient-to-r from-school-navy via-school-blue to-school-green bg-clip-text text-transparent">
                  ICCT College
                </span>
                <br />
                <span className="text-school-navy/80">Attendance System</span>
              </h1>
              
              <p className={`text-school-gray max-w-3xl mx-auto leading-relaxed ${isMobile ? 'text-lg' : 'text-xl'}`}>
                Streamline your educational experience with our advanced RFID-powered attendance management system. 
                Designed for modern academic institutions to enhance learning outcomes through precise attendance tracking.
              </p>
            </div>

            {pendingRFID && (
              <div className="inline-flex items-center px-8 py-4 bg-school-gold/20 backdrop-blur-sm rounded-xl border border-school-gold/30 animate-educational-pulse">
                <div className="w-3 h-3 bg-school-gold rounded-full mr-4 animate-ping"></div>
                <span className={`text-school-navy font-semibold ${isMobile ? 'text-sm' : 'text-base'}`}>
                  New RFID Card Detected: {pendingRFID}
                </span>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-slide-up">
              {features.map((feature, index) => (
                <div 
                  key={feature.title}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-school-blue/10 hover:border-school-blue/30 transition-all duration-300 hover:scale-105 hover:shadow-lg group"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="text-school-blue mb-4 group-hover:text-school-green transition-colors duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-school-navy font-bold text-lg mb-3">{feature.title}</h3>
                  <p className="text-school-gray text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* Login Card */}
            <div className="max-w-md mx-auto w-full animate-slide-up">
              <Card className="bg-white/95 backdrop-blur-xl border-school-blue/20 shadow-xl rounded-2xl">
                <CardHeader className="text-center pb-6 bg-gradient-to-r from-school-navy to-school-blue rounded-t-2xl text-white">
                  <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className={`text-white ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                    {autoAdminMode ? 'Admin Access Required' : 'Student Portal'}
                  </CardTitle>
                  <CardDescription className={`text-white/90 ${isMobile ? 'text-sm' : 'text-base'}`}>
                    {autoAdminMode 
                      ? 'Administrator login required for RFID registration'
                      : 'Enter your Student ID (TA202200XXX) or Administrator credentials'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className={`${isMobile ? 'p-6' : 'p-8'} bg-white rounded-b-2xl`}>
                  {!autoAdminMode && (
                    <form onSubmit={handleIdSubmit} className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="id" className="text-school-navy font-semibold">Academic ID</Label>
                        <Input
                          id="id"
                          type="text"
                          placeholder="Enter Student ID or Admin ID"
                          value={idInput}
                          onChange={(e) => setIdInput(e.target.value)}
                          className={`input-school ${isMobile ? 'h-12 text-base' : 'h-14'} border-2`}
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className={`btn-school-primary w-full ${isMobile ? 'h-12 text-base' : 'h-14'}`}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                            Authenticating...
                          </div>
                        ) : (
                          <>
                            <GraduationCap className="w-5 h-5 mr-2" />
                            Access Academic Portal
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                  
                  {autoAdminMode && (
                    <div className="text-center space-y-6">
                      <div className="p-6 bg-school-gold/10 rounded-xl border border-school-gold/30">
                        <School className="w-12 h-12 text-school-gold mx-auto mb-3" />
                        <p className={`text-school-navy font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>
                          Unregistered RFID detected. Administrator access required for student enrollment.
                        </p>
                      </div>
                      <Button 
                        onClick={() => setShowPasswordDialog(true)}
                        className={`btn-school-primary w-full ${isMobile ? 'h-12 text-base' : 'h-14'}`}
                      >
                        <Users className="w-5 h-5 mr-2" />
                        Administrator Login
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
        <DialogContent className={`bg-white border-school-blue/20 text-school-navy ${isMobile ? 'w-[95vw] max-w-sm' : 'max-w-lg'} rounded-2xl`}>
          <DialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-school-blue/10 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-school-blue" />
            </div>
            <DialogTitle className={`text-school-navy font-bold ${isMobile ? 'text-lg' : 'text-xl'}`}>
              Administrator Authentication
            </DialogTitle>
            <DialogDescription className={`text-school-gray ${isMobile ? 'text-sm' : 'text-base'}`}>
              {pendingRFID 
                ? `Please authenticate to register RFID: ${pendingRFID}`
                : "Enter your administrator credentials to access the management dashboard"
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="admin-id" className="text-school-navy font-semibold">Administrator ID</Label>
              <Input
                id="admin-id"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="Enter administrator ID"
                className={`input-school ${isMobile ? 'h-12 text-base' : ''}`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-school-navy font-semibold">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter administrator password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`input-school ${isMobile ? 'h-12 text-base' : ''}`}
              />
            </div>
            <div className={`flex gap-4 ${isMobile ? 'flex-col' : ''}`}>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowPasswordDialog(false)}
                className={`btn-school-secondary ${isMobile ? 'w-full h-12' : 'flex-1'}`}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className={`btn-school-primary ${isMobile ? 'w-full h-12' : 'flex-1'}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  'Authenticate'
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
