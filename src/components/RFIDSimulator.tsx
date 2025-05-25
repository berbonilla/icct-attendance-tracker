
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scan } from 'lucide-react';

const RFIDSimulator: React.FC = () => {
  const [rfidInput, setRfidInput] = useState('');

  const simulateRFIDScan = (rfid?: string) => {
    const testRFID = rfid || rfidInput || '32:65:C1:4C';
    
    // In a real application, this would update the database
    // For simulation, we'll just log it
    console.log('Simulating RFID scan:', testRFID);
    
    // You would update the ScannedIDs in the database here
    // For now, we'll just show the test RFID was scanned
  };

  const testRFIDs = [
    '32:65:C1:4C', // Unregistered
    'BD:31:1B:2A', // Juan Dela Cruz
    'A7:F2:C8:41', // Maria Santos
    'FF:FF:FF:FF'  // Another unregistered
  ];

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
            placeholder="32:65:C1:4C"
            pattern="[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}"
          />
          <Button 
            onClick={() => simulateRFIDScan()}
            className="w-full bg-light-blue hover:bg-dark-blue text-white"
          >
            Scan Custom RFID
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Quick Test RFIDs</Label>
          {testRFIDs.map((rfid) => (
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
      </CardContent>
    </Card>
  );
};

export default RFIDSimulator;
