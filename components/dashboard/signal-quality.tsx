'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

type SignalStatus = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'No Signal';

export default function SignalQuality() {
  const [status, setStatus] = useState<SignalStatus>('Good');
  const [signalStrength, setSignalStrength] = useState(85);

  useEffect(() => {
    const interval = setInterval(() => {
      const strength = Math.floor(Math.random() * 100);
      setSignalStrength(strength);
      
      if (strength >= 90) setStatus('Excellent');
      else if (strength >= 70) setStatus('Good');
      else if (strength >= 50) setStatus('Fair');
      else if (strength >= 20) setStatus('Poor');
      else setStatus('No Signal');
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getStatusConfig = (status: SignalStatus) => {
    switch (status) {
      case 'Excellent':
        return {
          bgColor: 'bg-green-50 border-green-200',
          textColor: 'text-green-700',
          iconBg: 'bg-green-500',
          barColor: '#16a34a',
          icon: '●●●●●',
        };
      case 'Good':
        return {
          bgColor: 'bg-green-50 border-green-200',
          textColor: 'text-green-600',
          iconBg: 'bg-green-500',
          barColor: '#22c55e',
          icon: '●●●●○',
        };
      case 'Fair':
        return {
          bgColor: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-700',
          iconBg: 'bg-yellow-500',
          barColor: '#f59e0b',
          icon: '●●●○○',
        };
      case 'Poor':
        return {
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-700',
          iconBg: 'bg-red-500',
          barColor: '#dc2626',
          icon: '●●○○○',
        };
      case 'No Signal':
        return {
          bgColor: 'bg-gray-50 border-gray-200',
          textColor: 'text-gray-700',
          iconBg: 'bg-gray-500',
          barColor: '#6b7280',
          icon: '●○○○○',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Card className={`bg-white shadow-lg ${config.bgColor} border hover:shadow-xl transition-all duration-300`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Signal Quality</h3>
            <p className="text-sm text-gray-500">Electrode connection status</p>
          </div>
          <div className={`w-3 h-3 rounded-full ${config.iconBg} animate-pulse`} />
        </div>
        
        <div className="space-y-4">
          {/* Status display */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-mono text-gray-400">{config.icon}</span>
              <div>
                <p className={`text-xl font-bold ${config.textColor}`}>{status}</p>
                <p className="text-sm text-gray-500">{signalStrength}% strength</p>
              </div>
            </div>
          </div>

          {/* Signal strength bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-gray-600">
              <span>Signal Strength</span>
              <span>{signalStrength}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-700 ease-out"
                style={{ 
                  width: `${signalStrength}%`,
                  backgroundColor: config.barColor
                }}
              />
            </div>
          </div>

          {/* Recommendations */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-700 mb-1">Status:</p>
            <p className="text-xs text-gray-600">
              {status === 'Excellent' && '✓ Perfect connection - optimal monitoring'}
              {status === 'Good' && '✓ Strong connection - good data quality'}
              {status === 'Fair' && '⚠ Adequate connection - minor adjustments needed'}
              {status === 'Poor' && '⚠ Weak connection - check electrode placement'}
              {status === 'No Signal' && '✕ Connection lost - reconnect electrodes'}
            </p>
          </div>

          {/* Real-time indicator */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <div className={`w-2 h-2 rounded-full ${config.iconBg} animate-pulse`} />
            <span className="text-xs font-medium text-gray-500">Live monitoring</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
