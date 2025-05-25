
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scan, UserPlus, Clock } from 'lucide-react';

interface ScannedRFID {
  id: string;
  timestamp: number;
}

interface RFIDScannerProps {
  onRegisterRFID: (rfidId: string) => void;
}

const RFIDScanner: React.FC<RFIDScannerProps> = ({ onRegisterRFID }) => {
  const [scannedRFIDs, setScannedRFIDs] = useState<Record<string, ScannedRFID>>({});
  const [students, setStudents] = useState<Record<string, any>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const dummyData = await import('../data/dummyData.json');
        setScannedRFIDs(dummyData.scannedRFIDs || {});
        setStudents(dummyData.students || {});
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
    
    // Refresh data every 5 seconds
    const interval = setInterval(loadData, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const isRFIDRegistered = (rfidId: string) => {
    return Object.values(students).some(student => student.rfid === rfidId);
  };

  const formatRFIDDisplay = (rfid: string) => {
    return rfid.toUpperCase().replace(/(.{2})/g, '$1 ').trim();
  };

  const simulateRFIDScan = () => {
    const testRFIDs = ['E1A2B3C4', 'F5D6E7A8', 'B9C1D2E3'];
    const randomRFID = testRFIDs[Math.floor(Math.random() * testRFIDs.length)];
    
    const newScannedRFID = {
      id: randomRFID,
      timestamp: Date.now()
    };

    setScannedRFIDs(prev => ({
      ...prev,
      [randomRFID]: newScannedRFID
    }));
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

        {/* Scanned RFIDs List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-dark-blue">Recently Scanned RFIDs</h3>
          
          {Object.entries(scannedRFIDs).length === 0 ? (
            <p className="text-gray-dark text-sm">No RFIDs scanned yet</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(scannedRFIDs)
                .sort(([,a], [,b]) => b.timestamp - a.timestamp)
                .map(([rfidId, data]) => {
                  const isRegistered = isRFIDRegistered(rfidId);
                  
                  return (
                    <Card key={rfidId} className={`border ${isRegistered ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-mono text-sm">{formatRFIDDisplay(rfidId)}</p>
                            <p className="text-xs text-gray-dark">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {new Date(data.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {isRegistered ? (
                              <Badge className="bg-green-500 text-white">Registered</Badge>
                            ) : (
                              <>
                                <Badge className="bg-yellow-500 text-white">Unregistered</Badge>
                                <Button
                                  size="sm"
                                  onClick={() => onRegisterRFID(rfidId)}
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
                  );
                })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RFIDScanner;
