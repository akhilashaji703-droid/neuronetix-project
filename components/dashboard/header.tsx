'use client';

import { useEffect, useState } from 'react';

interface HeaderProps {
  isConnected: boolean;
  samplingRate: number;
  signalQuality?: number;
}

type SignalStatus = 'Excellent' | 'Good' | 'Fair' | 'Poor';

export default function Header({ isConnected, samplingRate, signalQuality }: HeaderProps) {
  const [signalStrength, setSignalStrength] = useState(signalQuality || 85);
  const [signalStatus, setSignalStatus] = useState<SignalStatus>('Good');

  useEffect(() => {
    // Use real signal quality from props if available
    if (signalQuality !== undefined) {
      setSignalStrength(Math.round(signalQuality));
      
      if (signalQuality >= 90) setSignalStatus('Excellent');
      else if (signalQuality >= 70) setSignalStatus('Good');
      else if (signalQuality >= 50) setSignalStatus('Fair');
      else setSignalStatus('Poor');
    }
  }, [signalQuality]);

  const getSignalConfig = (status: SignalStatus) => {
    switch (status) {
      case 'Excellent':
        return { color: 'text-green-600', bg: 'bg-green-50', dot: 'bg-green-500', bars: 4 };
      case 'Good':
        return { color: 'text-green-600', bg: 'bg-green-50', dot: 'bg-green-500', bars: 3 };
      case 'Fair':
        return { color: 'text-yellow-600', bg: 'bg-yellow-50', dot: 'bg-yellow-500', bars: 2 };
      case 'Poor':
        return { color: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-500', bars: 1 };
    }
  };

  const config = getSignalConfig(signalStatus);

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white text-lg font-bold">🧠</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">NeuroNetix</h1>
            <p className="text-xs text-gray-500">EEG Brain Signal Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          {/* Signal Quality - Minimized */}
          <div className={`flex items-center gap-2 ${config.bg} px-3 py-1.5 rounded-lg`}>
            <div className="flex items-end gap-0.5 h-4">
              {[1, 2, 3, 4].map((bar) => (
                <div
                  key={bar}
                  className={`w-1 rounded-sm transition-all ${
                    bar <= config.bars ? config.dot : 'bg-gray-300'
                  }`}
                  style={{ height: `${bar * 4}px` }}
                />
              ))}
            </div>
            <span className={`text-xs font-medium ${config.color} hidden sm:inline`}>
              {signalStatus}
            </span>
            <span className={`text-xs ${config.color}`}>{signalStrength}%</span>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className={`text-xs font-medium ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
              {isConnected ? 'Live' : 'Off'}
            </span>
          </div>

          {/* Sampling Rate */}
          <div className="hidden md:flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
            <span className="text-xs text-gray-500">Rate:</span>
            <span className="text-xs font-semibold text-gray-800">{samplingRate}Hz</span>
          </div>
        </div>
      </div>
    </header>
  );
}
