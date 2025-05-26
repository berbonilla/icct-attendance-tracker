
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scan, UserPlus, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { database } from '@/config/firebase';
import { ref, onValue, set, off } from 'firebase/database';

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
  const [availableRFIDs, setAvailableRFIDs] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { setAutoAdminMode, setPendingRFID } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    console.log('🔗 RFIDScanner: Connecting to Firebase Database');
    setScannerStatus('scanning');
    
    // Set up real-time listener for the entire database
    const dbRef = ref(database);
    
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const databaseData = snapshot.val() as DatabaseData | null;
      
      console.log('🔥 RFIDScanner: Firebase data received:', databaseData);
      
      if (databaseData) {
        setIsConnected(true);
        setStudents(databaseData.students || {});
        
        // Extract available RFIDs from student database for simulation
        const studentRFIDs = Object.values(databaseData.students || {})
          .map(student => student.rfid)
          .filter(rfid => rfid) as string[];
        
        setAvailableRFIDs(studentRFIDs);
        
        console.log('Scanner: Available RFIDs from Firebase:', studentRFIDs);
        
        // Process scanned RFIDs with timestamps
        if (databaseData.ScannedIDs && Object.keys(databaseData.ScannedIDs).length > 0) {
          setScannedRFIDs(databaseData.ScannedIDs);
          
          // Find the earliest unprocessed RFID
          const unprocessedRFIDs = Object.entries(databaseData.ScannedIDs)
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
            const studentEntries = Object.values(databaseData.students || {});
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
          console.log('Scanner: No ScannedIDs found in Firebase');
          setScannerStatus('idle');
          setScannedRFIDs({});
          setCurrentRFID('');
        }
      } else {
        console.log('Scanner: Firebase database is empty');
        setIsConnected(true);
        setScannerStatus('idle');
        setStudents({});
        setScannedRFIDs({});
        setCurrentRFID('');
        setAvailableRFIDs([]);
      }
    }, (error) => {
      console.error('❌ RFIDScanner: Firebase error:', error);
      setIsConnected(false);
      setScannerStatus('idle');
    });
    
    return () => {
      off(dbRef);
      unsubscribe();
    };
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
    // Generate a random RFID that might or might not be in the database
    const allPossibleRFIDs = [
      ...availableRFIDs, // RFIDs from database
      // Add some random unregistered RFIDs for testing
      ...Array.from({ length: 3 }, () => {
        const hex = () => Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0');
        return `${hex()}:${hex()}:${hex()}:${hex()}`;
      })
    ];
    
    if (allPossibleRFIDs.length === 0) {
      // Create a completely random RFID if no RFIDs available
      const hex = () => Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0');
      allPossibleRFIDs.push(`${hex()}:${hex()}:${hex()}:${hex()}`);
    }
    
    const randomRFID = allPossibleRFIDs[Math.floor(Math.random() * allPossibleRFIDs.length)];
    const timestamp = Date.now();
    
    console.log('Simulating RFID scan to Firebase:', { rfid: randomRFID, timestamp });
    
    // Write to Firebase ScannedIDs
    try {
      const scannedIDRef = ref(database, `ScannedIDs/${randomRFID}`);
      await set(scannedIDRef, {
        timestamp,
        processed: false
      });
      
      console.log('✅ RFID scan written to Firebase:', randomRFID);
    } catch (error) {
      console.error('❌ Error writing RFID scan to Firebase:', error);
    }
  };

  const getScannedRFIDsList = () => {
    return Object.entries(scannedRFIDs)
      .sort(([, a], [, b]) => b.timestamp - a.timestamp)
      .slice(0, 5); // Show last 5 scans
  };

  const getScannerStatusIcon = () => {
    if (!isConnected) {
      return <AlertCircle className="w-4 h-4 text-red animate-pulse" />;
    }
    
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
    if (!isConnected) {
      return 'Connecting to Firebase...';
    }
    
    switch (scannerStatus) {
      case 'scanning':
        return 'Monitoring Firebase for RFIDs...';
      case 'processing':
        return 'Processing RFID data...';
      default:
        return 'Connected to Firebase';
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
              {isMobile ? (isConnected ? 'Connected' : 'Connecting...') : getScannerStatusText()}
            </span>
          </div>
        </CardTitle>
        <CardDescription className={isMobile ? 'text-xs' : 'text-sm'}>
          {isMobile ? 'Real-time Firebase monitoring' : 'Real-time monitoring of Firebase database for RFID scans'}
        </CardDescription>
      </CardHeader>
      <CardContent className={`space-y-4 ${isMobile ? 'p-4' : 'p-6'}`}>
        {/* Simulate RFID Scan Button */}
        <Button 
          onClick={simulateRFIDScan}
          className={`w-full bg-light-blue hover:bg-dark-blue text-white ${isMobile ? 'h-12 text-base' : ''}`}
          disabled={!isConnected}
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
              {isMobile ? 'Monitoring Firebase' : 'Scanner is monitoring Firebase database in real-time'}
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
              <span>Firebase:</span>
              <Badge variant="outline" className={`${isConnected ? 'text-green-600' : 'text-red'} ${isMobile ? 'text-xs px-1 py-0.5' : ''}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Students:</span>
              <Badge variant="outline" className={isMobile ? 'text-xs px-1 py-0.5' : ''}>
                {Object.keys(students).length}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Available RFIDs:</span>
              <Badge variant="outline" className={isMobile ? 'text-xs px-1 py-0.5' : ''}>
                {availableRFIDs.length}
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
                  <span>Monitoring:</span>
                  <Badge variant="outline">Real-time</Badge>
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
