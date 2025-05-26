
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scan } from 'lucide-react';

interface StudentData {
  name: string;
  course: string;
  year: string;
  section: string;
  rfid?: string;
}

interface DatabaseData {
  students: Record<string, StudentData>;
}

const RFIDSimulator: React.FC = () => {
  const [rfidInput, setRfidInput] = useState('');
  const [availableRFIDs, setAvailableRFIDs] = useState<string[]>([]);

  useEffect(() => {
    const loadRFIDs = async () => {
      try {
        const dummyDataModule = await import('../data/updatedDummyData.json');
        const dummyData = dummyDataModule.default as DatabaseData;
        
        // Extract RFIDs from student database
        const studentRFIDs = Object.values(dummyData.students || {})
          .map(student => student.rfid)
          .filter(rfid => rfid) as string[];
        
        setAvailableRFIDs(studentRFIDs);
        console.log('RFIDSimulator: Loaded RFIDs from database:', studentRFIDs);
      } catch (error) {
        console.error('RFIDSimulator: Error loading RFIDs:', error);
      }
    };

    loadRFIDs();
  }, []);

  const simulateRFIDScan = (rfid?: string) => {
    const testRFID = rfid || rfidInput || (availableRFIDs.length > 0 ? availableRFIDs[0] : '');
    
    if (!testRFID) {
      console.log('No RFID available for simulation');
      return;
    }
    
    // In a real application, this would update the database
    // For simulation, we'll just log it
    console.log('Simulating RFID scan:', testRFID);
    
    // You would update the ScannedIDs in the database here
    // For now, we'll just show the test RFID was scanned
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-dark-blue flex items-center">
          <Scan className="w-5 h-5 mr-2" />
          RFID Simulator
        </CardTitle>
        <CardDescription>
          Simulate RFID scanning for testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="rfid-input">Custom RFID</Label>
          <Input
            id="rfid-input"
            value={rfidInput}
            onChange={(e) => setRfidInput(e.target.value)}
            placeholder={availableRFIDs.length > 0 ? availableRFIDs[0] : "No RFIDs in database"}
            pattern="[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}"
          />
          <Button 
            onClick={() => simulateRFIDScan()}
            className="w-full bg-light-blue hover:bg-dark-blue text-white"
            disabled={!rfidInput && availableRFIDs.length === 0}
          >
            Scan Custom RFID
          </Button>
        </div>

        {availableRFIDs.length > 0 && (
          <div className="space-y-2">
            <Label>Database RFIDs</Label>
            {availableRFIDs.map((rfid) => (
              <Button
                key={rfid}
                variant="outline"
                onClick={() => simulateRFIDScan(rfid)}
                className="w-full justify-start font-mono text-sm"
              >
                {rfid}
              </Button>
            ))}
          </div>
        )}

        {availableRFIDs.length === 0 && (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">
              No RFIDs found in database
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RFIDSimulator;
