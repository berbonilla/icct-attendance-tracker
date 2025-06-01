
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface DashboardStatusBarProps {
  isConnected: boolean;
  pendingRFID?: string | null;
}

const DashboardStatusBar: React.FC<DashboardStatusBarProps> = ({ 
  isConnected, 
  pendingRFID 
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
      <div>
        <h2 className="text-3xl font-bold text-dark-blue">Dashboard</h2>
        <p className="text-gray-dark">System overview and management</p>
      </div>
      <div className="flex items-center space-x-2">
        <Badge variant={isConnected ? 'default' : 'secondary'} className="px-3 py-1">
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </Badge>
        {pendingRFID && (
          <Badge variant="outline" className="px-3 py-1 border-orange-500 text-orange-700">
            Pending RFID: {pendingRFID}
          </Badge>
        )}
      </div>
    </div>
  );
};

export default DashboardStatusBar;
