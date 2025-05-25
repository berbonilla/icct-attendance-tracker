
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, CreditCard } from 'lucide-react';

interface RFIDRegistrationDialogProps {
  rfidId: string;
  isOpen: boolean;
  onClose: () => void;
  onRegister: () => void;
}

const RFIDRegistrationDialog: React.FC<RFIDRegistrationDialogProps> = ({
  rfidId,
  isOpen,
  onClose,
  onRegister
}) => {
  const formatRFIDDisplay = (rfid: string) => {
    // Convert to uppercase and add spaces every 2 characters for display
    return rfid.toUpperCase().replace(/(.{2})/g, '$1 ').trim();
  };

  const handleRegister = () => {
    console.log('Starting registration process for RFID:', rfidId);
    onRegister();
  };

  const handleIgnore = () => {
    toast({
      title: "RFID Ignored",
      description: `RFID ${formatRFIDDisplay(rfidId)} has been ignored.`
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-dark-blue flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
            Unknown RFID Detected
          </DialogTitle>
          <DialogDescription>
            An unregistered RFID card has been detected
          </DialogDescription>
        </DialogHeader>
        
        <Card className="border border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center text-yellow-800">
              <CreditCard className="w-5 h-5 mr-2" />
              RFID Card Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-dark font-medium">RFID ID:</p>
                <p className="font-mono text-lg bg-white p-2 rounded border">
                  {formatRFIDDisplay(rfidId)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-dark">Detected at:</p>
                <p className="text-sm">{new Date().toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <p className="text-sm text-gray-dark">
            Would you like to register this RFID card for a new student?
          </p>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleIgnore}
              className="flex-1"
            >
              Ignore
            </Button>
            <Button
              onClick={handleRegister}
              className="flex-1 bg-dark-blue hover:bg-light-blue text-white"
            >
              Register Student
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RFIDRegistrationDialog;
