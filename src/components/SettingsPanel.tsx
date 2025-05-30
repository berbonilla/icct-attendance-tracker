
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EmailTestPanel from './EmailTestPanel';

interface SettingsPanelProps {
  isConnected: boolean;
  onToggleTracking: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isConnected, onToggleTracking }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Settings</CardTitle>
        <CardDescription>Configure system behavior and notifications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <EmailTestPanel isConnected={isConnected} />
          
          <div className="p-4 border border-gray-medium rounded-lg">
            <h3 className="font-semibold mb-2">Absentee Alerts</h3>
            <p className="text-sm text-gray-dark mb-3">Configure automatic notifications for student absences</p>
            <Button 
              onClick={onToggleTracking}
              disabled={!isConnected}
              className={`${isConnected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'} text-white`}
            >
              {isConnected ? 'Tracking Active ✓' : 'Enable Tracking'}
            </Button>
            <div className="mt-2">
              <Badge variant={isConnected ? 'default' : 'secondary'}>
                Status: {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
          </div>

          <div className="p-4 border border-gray-medium rounded-lg">
            <h3 className="font-semibold mb-2">Data Management</h3>
            <p className="text-sm text-gray-dark mb-3">Backup and restore attendance data</p>
            <div className="space-x-2">
              <Button variant="outline" size="sm">Export Data</Button>
              <Button variant="outline" size="sm">Import Data</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsPanel;
