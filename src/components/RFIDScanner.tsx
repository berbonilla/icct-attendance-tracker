
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scan, UserPlus, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface RFIDScannerProps {
  onRegisterRFID: (rfidId: string) => void;
}

const RFIDScanner: React.FC<RFIDScannerProps> = ({ onRegisterRFID }) => {
  const [scannedRFID, setScannedRFID] = useState<string>('');
  const [students, setStudents] = useState<Record<string, any>>({});
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const { setAutoAdminMode, setPendingRFID } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        const dummyData = await import('../data/dummyData.json');
        setStudents(dummyData.students || {});
        
        // Check for scanned RFID from the data
        if (dummyData.ScannedIDs && dummyData.ScannedIDs.RFID) {
          const currentRFID = dummyData.ScannedIDs.RFID;
          if (currentRFID !== scannedRFID) {
            setScannedRFID(currentRFID);
            setLastScanTime(Date.now());
            
            // Check if RFID is registered
            const isRegistered = Object.values(dummyData.students).some(
              student => student.rfid === currentRFID
            );
            
            if (!isRegistered) {
              console.log('Unregistered RFID detected, triggering admin mode');
              setPendingRFID(currentRFID);
              setAutoAdminMode(true);
            }
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
    
    // Refresh data every 2 seconds to check for new scans
    const interval = setInterval(loadData, 2000);
    
    return () => clearInterval(interval);
  }, [scannedRFID, setAutoAdminMode, setPendingRFID]);

  const isRFIDRegistered = (rfidId: string) => {
    return Object.values(students).some(student => student.rfid === rfidId);
  };

  const formatRFIDDisplay = (rfid: string) => {
    // Handle both formats: with and without colons
    if (rfid.includes(':')) {
      return rfid.toUpperCase();
    }
    // Add colons every 2 characters
    return rfid.toUpperCase().replace(/(.{2})/g, '$1:').slice(0, -1);
  };

  const simulateRFIDScan = () => {
    const testRFIDs = ['32:65:C1:4C', 'FF:FF:FF:FF', 'AA:BB:CC:DD'];
    const randomRFID = testRFIDs[Math.floor(Math.random() * testRFIDs.length)];
    
    setScannedRFID(randomRFID);
    setLastScanTime(Date.now());
    
    // Check if RFID is registered
    const isRegistered = Object.values(students).some(student => student.rfid === randomRFID);
    
    if (!isRegistered) {
      console.log('Unregistered RFID detected, triggering admin mode');
      setPendingRFID(randomRFID);
      setAutoAdminMode(true);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-dark-blue flex items-center">
          <Scan className="w-5 h-5 mr-2" />
          RFID Scanner
        </CardTitle>
        <CardDescription>
          Scan RFID cards and register new students
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Simulate RFID Scan Button */}
        <Button 
          onClick={simulateRFIDScan}
          className="w-full bg-light-blue hover:bg-dark-blue text-white"
        >
          <Scan className="w-4 h-4 mr-2" />
          Simulate RFID Scan
        </Button>

        {/* Current Scanned RFID */}
        {scannedRFID && (
          <div className="space-y-3">
            <h3 className="font-semibold text-dark-blue">Recently Scanned RFID</h3>
            
            <Card className={`border ${isRFIDRegistered(scannedRFID) ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm">{formatRFIDDisplay(scannedRFID)}</p>
                    <p className="text-xs text-gray-dark">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(lastScanTime).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isRFIDRegistered(scannedRFID) ? (
                      <Badge className="bg-green-500 text-white">Registered</Badge>
                    ) : (
                      <>
                        <Badge className="bg-yellow-500 text-white">Unregistered</Badge>
                        <Button
                          size="sm"
                          onClick={() => onRegisterRFID(scannedRFID)}
                          className="bg-dark-blue hover:bg-light-blue text-white"
                        >
                          <UserPlus className="w-3 h-3 mr-1" />
                          Register
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!scannedRFID && (
          <p className="text-gray-dark text-sm text-center">No RFID scanned yet</p>
        )}
      </CardContent>
    </Card>
  );
};

export default RFIDScanner;
