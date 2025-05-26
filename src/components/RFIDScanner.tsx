import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scan, UserPlus, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface RFIDScannerProps {
  onRegisterRFID: (rfidId: string) => void;
}

interface ScannedRFIDData {
  timestamp: number;
  processed: boolean;
}

interface StudentData {
  name: string;
  course: string;
  year: string;
  section: string;
  rfid?: string;
}

interface DatabaseData {
  ScannedIDs: Record<string, ScannedRFIDData>;
  students: Record<string, StudentData>;
  adminUsers: Record<string, any>;
  schedules: Record<string, any>;
  attendanceRecords: Record<string, any>;
  absenteeAlerts: Record<string, any>;
}

const RFIDScanner: React.FC<RFIDScannerProps> = ({ onRegisterRFID }) => {
  const [scannedRFIDs, setScannedRFIDs] = useState<Record<string, ScannedRFIDData>>({});
  const [currentRFID, setCurrentRFID] = useState<string>('');
  const [students, setStudents] = useState<Record<string, StudentData>>({});
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const [processedRFIDs, setProcessedRFIDs] = useState<Set<string>>(new Set());
  const [scannerStatus, setScannerStatus] = useState<'idle' | 'scanning' | 'processing'>('idle');
  const { setAutoAdminMode, setPendingRFID } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      setScannerStatus('scanning');
      try {
        const dummyDataModule = await import('../data/updatedDummyData.json');
        const dummyData = dummyDataModule.default as DatabaseData;
        setStudents(dummyData.students || {});
        
        console.log('Scanner: Loading scanned RFIDs...', dummyData.ScannedIDs);
        console.log('Scanner: Loaded students:', Object.keys(dummyData.students || {}).length, 'students');
        
        // Process scanned RFIDs with timestamps
        if (dummyData.ScannedIDs && Object.keys(dummyData.ScannedIDs).length > 0) {
          setScannedRFIDs(dummyData.ScannedIDs);
          
          // Find the earliest unprocessed RFID
          const unprocessedRFIDs = Object.entries(dummyData.ScannedIDs)
            .filter(([rfid, data]) => !data.processed && !processedRFIDs.has(rfid))
            .sort(([, a], [, b]) => a.timestamp - b.timestamp);

          console.log('Scanner: Unprocessed RFIDs found:', unprocessedRFIDs);

          if (unprocessedRFIDs.length > 0) {
            setScannerStatus('processing');
            const [earliestRFID, data] = unprocessedRFIDs[0];
            console.log('Scanner: Processing earliest unprocessed RFID:', earliestRFID, 'timestamp:', data.timestamp);
            
            setCurrentRFID(earliestRFID);
            setLastScanTime(data.timestamp);
            
            // Mark as processed locally to avoid reprocessing
            setProcessedRFIDs(prev => new Set([...prev, earliestRFID]));
            
            // Check if RFID is registered in students database
            const studentEntries = Object.values(dummyData.students || {});
            const isRegistered = studentEntries.length > 0 && studentEntries.some(
              student => student.rfid === earliestRFID
            );
            
            console.log('Scanner: RFID registration check:', { 
              rfid: earliestRFID, 
              isRegistered,
              studentCount: studentEntries.length,
              availableRFIDs: studentEntries.map(s => s.rfid)
            });
            
            if (!isRegistered) {
              console.log('Scanner: Unregistered RFID detected, triggering admin mode');
              setPendingRFID(earliestRFID);
              setAutoAdminMode(true);
            } else {
              console.log('Scanner: RFID is registered, processing attendance');
              // TODO: Process attendance for registered RFID
            }
          } else {
            setScannerStatus('idle');
          }
        } else {
          console.log('Scanner: No ScannedIDs found');
          setScannerStatus('idle');
          setScannedRFIDs({});
          setCurrentRFID('');
        }
      } catch (error) {
        console.error('Scanner: Error loading data:', error);
        setScannerStatus('idle');
      }
    };

    // Initial load
    loadData();
    
    // Scan for new RFIDs every 5 seconds
    const interval = setInterval(loadData, 5000);
    
    return () => clearInterval(interval);
  }, [setAutoAdminMode, setPendingRFID, processedRFIDs]);

  const isRFIDRegistered = (rfidId: string) => {
    const studentEntries = Object.values(students);
    const registered = studentEntries.length > 0 && studentEntries.some(student => student.rfid === rfidId);
    console.log('Checking RFID registration:', { 
      rfidId, 
      registered, 
      studentCount: studentEntries.length,
      studentRFIDs: studentEntries.map(s => s.rfid)
    });
    return registered;
  };

  const formatRFIDDisplay = (rfid: string) => {
    return rfid.toUpperCase();
  };

  const simulateRFIDScan = async () => {
    const testRFIDs = ['9B:54:8E:02', 'FF:FF:FF:FF', 'AA:BB:CC:DD', 'BD:31:1B:2A'];
    const randomRFID = testRFIDs[Math.floor(Math.random() * testRFIDs.length)];
    const timestamp = Date.now();
    
    console.log('Simulating RFID scan:', { rfid: randomRFID, timestamp });
    
    // Update local state immediately for responsive UI
    const newScannedData: ScannedRFIDData = {
      timestamp,
      processed: false
    };
    
    setScannedRFIDs(prev => ({
      ...prev,
      [randomRFID]: newScannedData
    }));
    setCurrentRFID(randomRFID);
    setLastScanTime(timestamp);
    
    console.log('Simulated scan - Added RFID to scanned list:', randomRFID);
    console.log('Simulated scan - Current students:', Object.keys(students).length);
    
    // Check if RFID is registered
    const studentEntries = Object.values(students);
    const isRegistered = studentEntries.length > 0 && studentEntries.some(student => student.rfid === randomRFID);
    
    console.log('Simulated scan - Registration check:', { 
      rfid: randomRFID, 
      isRegistered,
      studentCount: studentEntries.length,
      availableRFIDs: studentEntries.map(s => s.rfid)
    });
    
    if (!isRegistered) {
      console.log('Simulated scan - Unregistered RFID, triggering admin mode');
      setPendingRFID(randomRFID);
      setAutoAdminMode(true);
    } else {
      console.log('Simulated scan - RFID is registered');
    }
  };

  const getScannedRFIDsList = () => {
    return Object.entries(scannedRFIDs)
      .sort(([, a], [, b]) => b.timestamp - a.timestamp)
      .slice(0, 5); // Show last 5 scans
  };

  const getScannerStatusIcon = () => {
    switch (scannerStatus) {
      case 'scanning':
        return <Scan className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'processing':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getScannerStatusText = () => {
    switch (scannerStatus) {
      case 'scanning':
        return 'Scanning for new RFIDs...';
      case 'processing':
        return 'Processing RFID data...';
      default:
        return 'Ready to scan';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-dark-blue flex items-center">
          <Scan className="w-5 h-5 mr-2" />
          RFID Scanner
          <div className="ml-auto flex items-center space-x-2">
            {getScannerStatusIcon()}
            <span className="text-sm font-normal">{getScannerStatusText()}</span>
          </div>
        </CardTitle>
        <CardDescription>
          Scanning every 5 seconds for new RFID inputs
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

        {/* Status when no scans */}
        {Object.keys(scannedRFIDs).length === 0 && (
          <div className="text-center py-4">
            <p className="text-gray-dark text-sm">No RFID scanned yet</p>
            <p className="text-xs text-gray-500 mt-1">Scanner is monitoring database every 5 seconds</p>
          </div>
        )}

        {/* Validation Status */}
        <div className="border-t pt-3 mt-4">
          <h4 className="text-sm font-semibold text-dark-blue mb-2">System Status</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Database Connection:</span>
              <Badge variant="outline" className="text-green-600">Connected</Badge>
            </div>
            <div className="flex justify-between">
              <span>Students Loaded:</span>
              <Badge variant="outline">{Object.keys(students).length}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Scanned RFIDs:</span>
              <Badge variant="outline">{Object.keys(scannedRFIDs).length}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Scan Interval:</span>
              <Badge variant="outline">5 seconds</Badge>
            </div>
            <div className="flex justify-between">
              <span>Scanner Status:</span>
              <Badge variant="outline" className={
                scannerStatus === 'idle' ? 'text-green-600' :
                scannerStatus === 'scanning' ? 'text-blue-600' : 'text-yellow-600'
              }>
                {scannerStatus.charAt(0).toUpperCase() + scannerStatus.slice(1)}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RFIDScanner;
