
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scan, UserPlus, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface RFIDScannerProps {
  onRegisterRFID: (rfidId: string) => void;
}

interface ScannedRFIDData {
  timestamp: number;
  processed: boolean;
}

const RFIDScanner: React.FC<RFIDScannerProps> = ({ onRegisterRFID }) => {
  const [scannedRFIDs, setScannedRFIDs] = useState<Record<string, ScannedRFIDData>>({});
  const [currentRFID, setCurrentRFID] = useState<string>('');
  const [students, setStudents] = useState<Record<string, any>>({});
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const [processedRFIDs, setProcessedRFIDs] = useState<Set<string>>(new Set());
  const { setAutoAdminMode, setPendingRFID } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        const dummyData = await import('../data/dummyData.json');
        setStudents(dummyData.students || {});
        
        // Process scanned RFIDs with timestamps
        if (dummyData.ScannedIDs) {
          setScannedRFIDs(dummyData.ScannedIDs);
          
          // Find the earliest unprocessed RFID
          const unprocessedRFIDs = Object.entries(dummyData.ScannedIDs)
            .filter(([rfid, data]) => !data.processed && !processedRFIDs.has(rfid))
            .sort(([, a], [, b]) => a.timestamp - b.timestamp);

          if (unprocessedRFIDs.length > 0) {
            const [earliestRFID, data] = unprocessedRFIDs[0];
            console.log('Processing earliest unprocessed RFID:', earliestRFID, 'timestamp:', data.timestamp);
            
            setCurrentRFID(earliestRFID);
            setLastScanTime(data.timestamp);
            
            // Mark as processed locally to avoid reprocessing
            setProcessedRFIDs(prev => new Set([...prev, earliestRFID]));
            
            // Check if RFID is registered in students database
            const isRegistered = Object.values(dummyData.students).some(
              student => student.rfid === earliestRFID
            );
            
            if (!isRegistered) {
              console.log('Unregistered RFID detected, triggering admin mode');
              setPendingRFID(earliestRFID);
              setAutoAdminMode(true);
            } else {
              console.log('RFID is registered:', earliestRFID);
            }
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
    
    // Scan for new RFIDs every 1 second
    const interval = setInterval(loadData, 1000);
    
    return () => clearInterval(interval);
  }, [setAutoAdminMode, setPendingRFID, processedRFIDs]);

  const isRFIDRegistered = (rfidId: string) => {
    return Object.values(students).some(student => student.rfid === rfidId);
  };

  const formatRFIDDisplay = (rfid: string) => {
    return rfid.toUpperCase();
  };

  const simulateRFIDScan = () => {
    const testRFIDs = ['9B:54:8E:02', 'FF:FF:FF:FF', 'AA:BB:CC:DD'];
    const randomRFID = testRFIDs[Math.floor(Math.random() * testRFIDs.length)];
    const timestamp = Date.now();
    
    // Add to scanned RFIDs with timestamp
    setScannedRFIDs(prev => ({
      ...prev,
      [randomRFID]: {
        timestamp,
        processed: false
      }
    }));
    
    setCurrentRFID(randomRFID);
    setLastScanTime(timestamp);
    
    // Check if RFID is registered
    const isRegistered = Object.values(students).some(student => student.rfid === randomRFID);
    
    if (!isRegistered) {
      console.log('Unregistered RFID detected, triggering admin mode');
      setPendingRFID(randomRFID);
      setAutoAdminMode(true);
    }
  };

  const getScannedRFIDsList = () => {
    return Object.entries(scannedRFIDs)
      .sort(([, a], [, b]) => b.timestamp - a.timestamp)
      .slice(0, 5); // Show last 5 scans
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-dark-blue flex items-center">
          <Scan className="w-5 h-5 mr-2" />
          RFID Scanner
        </CardTitle>
        <CardDescription>
          Continuously scanning for RFID inputs
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

        {/* Current Processing RFID */}
        {currentRFID && (
          <div className="space-y-3">
            <h3 className="font-semibold text-dark-blue">Currently Processing</h3>
            
            <Card className={`border ${isRFIDRegistered(currentRFID) ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm">{formatRFIDDisplay(currentRFID)}</p>
                    <p className="text-xs text-gray-dark">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(lastScanTime).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isRFIDRegistered(currentRFID) ? (
                      <Badge className="bg-green-500 text-white">Registered</Badge>
                    ) : (
                      <>
                        <Badge className="bg-yellow-500 text-white">Unregistered</Badge>
                        <Button
                          size="sm"
                          onClick={() => onRegisterRFID(currentRFID)}
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

        {/* Recent Scans History */}
        {getScannedRFIDsList().length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-dark-blue">Recent Scans</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {getScannedRFIDsList().map(([rfid, data]) => (
                <div key={`${rfid}-${data.timestamp}`} className="text-xs p-2 bg-gray-50 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-mono">{formatRFIDDisplay(rfid)}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant={data.processed ? "secondary" : "default"} className="text-xs">
                        {data.processed ? "Processed" : "Pending"}
                      </Badge>
                      <span className="text-gray-500">
                        {new Date(data.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {Object.keys(scannedRFIDs).length === 0 && (
          <p className="text-gray-dark text-sm text-center">No RFID scanned yet</p>
        )}
      </CardContent>
    </Card>
  );
};

export default RFIDScanner;
