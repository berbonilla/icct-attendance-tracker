import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scan, UserPlus, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

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
        <CardTitle className={`text-dark-blue flex items-center ${isMobile ? 'text-lg' : 'text-xl'}`}>
          <Scan className={`mr-2 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
          RFID Scanner
          <div className={`ml-auto flex items-center ${isMobile ? 'space-x-1' : 'space-x-2'}`}>
            {getScannerStatusIcon()}
            <span className={`font-normal ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {isMobile ? 'Scanning...' : getScannerStatusText()}
            </span>
          </div>
        </CardTitle>
        <CardDescription className={isMobile ? 'text-xs' : 'text-sm'}>
          {isMobile ? 'Scanning for RFIDs' : 'Scanning every 5 seconds for new RFID inputs'}
        </CardDescription>
      </CardHeader>
      <CardContent className={`space-y-4 ${isMobile ? 'p-4' : 'p-6'}`}>
        {/* Simulate RFID Scan Button */}
        <Button 
          onClick={simulateRFIDScan}
          className={`w-full bg-light-blue hover:bg-dark-blue text-white ${isMobile ? 'h-12 text-base' : ''}`}
        >
          <Scan className={`mr-2 ${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} />
          {isMobile ? 'Simulate Scan' : 'Simulate RFID Scan'}
        </Button>

        {/* Current Processing RFID */}
        {currentRFID && (
          <div className="space-y-3">
            <h3 className={`font-semibold text-dark-blue ${isMobile ? 'text-sm' : 'text-base'}`}>
              Currently Processing
            </h3>
            
            <Card className={`border ${isRFIDRegistered(currentRFID) ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
              <CardContent className={`p-3 ${isMobile ? 'p-2' : ''}`}>
                <div className={`flex items-center justify-between ${isMobile ? 'flex-col space-y-2' : ''}`}>
                  <div className={isMobile ? 'text-center' : ''}>
                    <p className={`font-mono ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      {formatRFIDDisplay(currentRFID)}
                    </p>
                    <p className={`text-gray-dark ${isMobile ? 'text-xs' : 'text-xs'}`}>
                      <Clock className={`inline mr-1 ${isMobile ? 'w-2 h-2' : 'w-3 h-3'}`} />
                      {new Date(lastScanTime).toLocaleString()}
                    </p>
                  </div>
                  <div className={`flex items-center ${isMobile ? 'space-x-1' : 'space-x-2'}`}>
                    {isRFIDRegistered(currentRFID) ? (
                      <Badge className={`bg-green-500 text-white ${isMobile ? 'text-xs px-2 py-1' : ''}`}>
                        Registered
                      </Badge>
                    ) : (
                      <>
                        <Badge className={`bg-yellow-500 text-white ${isMobile ? 'text-xs px-2 py-1' : ''}`}>
                          {isMobile ? 'New' : 'Unregistered'}
                        </Badge>
                        <Button
                          size={isMobile ? "sm" : "sm"}
                          onClick={() => onRegisterRFID(currentRFID)}
                          className={`bg-dark-blue hover:bg-light-blue text-white ${isMobile ? 'text-xs px-2 py-1' : ''}`}
                        >
                          <UserPlus className={`mr-1 ${isMobile ? 'w-2 h-2' : 'w-3 h-3'}`} />
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
            <h3 className={`font-semibold text-dark-blue ${isMobile ? 'text-sm' : 'text-base'}`}>
              Recent Scans
            </h3>
            <div className={`space-y-2 overflow-y-auto ${isMobile ? 'max-h-32' : 'max-h-48'}`}>
              {getScannedRFIDsList().map(([rfid, data]) => (
                <div key={`${rfid}-${data.timestamp}`} className={`p-2 bg-gray-50 rounded ${isMobile ? 'text-xs' : 'text-xs'}`}>
                  <div className={`flex justify-between items-center ${isMobile ? 'flex-col space-y-1' : ''}`}>
                    <span className={`font-mono ${isMobile ? 'text-xs' : ''}`}>
                      {formatRFIDDisplay(rfid)}
                    </span>
                    <div className={`flex items-center ${isMobile ? 'space-x-1' : 'space-x-2'}`}>
                      <Badge variant={data.processed ? "secondary" : "default"} className={isMobile ? 'text-xs px-1 py-0.5' : 'text-xs'}>
                        {data.processed ? "Processed" : "Pending"}
                      </Badge>
                      <span className={`text-gray-500 ${isMobile ? 'text-xs' : ''}`}>
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
            <p className={`text-gray-dark ${isMobile ? 'text-xs' : 'text-sm'}`}>
              No RFID scanned yet
            </p>
            <p className={`text-gray-500 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
              {isMobile ? 'Monitoring database' : 'Scanner is monitoring database every 5 seconds'}
            </p>
          </div>
        )}

        {/* Validation Status */}
        <div className="border-t pt-3 mt-4">
          <h4 className={`font-semibold text-dark-blue mb-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            System Status
          </h4>
          <div className={`space-y-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
            <div className="flex justify-between">
              <span>Database:</span>
              <Badge variant="outline" className={`text-green-600 ${isMobile ? 'text-xs px-1 py-0.5' : ''}`}>
                Connected
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Students:</span>
              <Badge variant="outline" className={isMobile ? 'text-xs px-1 py-0.5' : ''}>
                {Object.keys(students).length}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Scanned:</span>
              <Badge variant="outline" className={isMobile ? 'text-xs px-1 py-0.5' : ''}>
                {Object.keys(scannedRFIDs).length}
              </Badge>
            </div>
            {!isMobile && (
              <>
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
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RFIDScanner;
