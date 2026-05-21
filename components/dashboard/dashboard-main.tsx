'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/dashboard/header';
import MentalStateCard from '@/components/dashboard/mental-state-card';
import StressGauge from '@/components/dashboard/stress-gauge';
import BrainwaveBarGraph from '@/components/dashboard/brainwave-bar-graph';
import RealTimeEEG from '@/components/dashboard/real-time-eeg';
import FrequencySpectrum from '@/components/dashboard/frequency-spectrum';
import { PatientData } from '@/components/onboarding';
import { Button } from '@/components/ui/button';
import { useEEG } from '@/hooks/use-eeg';

interface DashboardProps {
  patientData: PatientData;
  onEndSession: () => void;
}

export default function Dashboard({ patientData, onEndSession }: DashboardProps) {
  const { isConnected, eegData, connectionStatus } = useEEG();
  const [sessionTime, setSessionTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        isConnected={isConnected} 
        samplingRate={connectionStatus?.sampling_rate || 256} 
        signalQuality={eegData?.signal_quality}
      />
      
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm">👤</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{patientData.name}</p>
                  <p className="text-xs text-gray-500">ID: {patientData.patientId} • {patientData.age}y • {patientData.gender}</p>
                </div>
              </div>
              
              <div className="h-8 w-px bg-gray-200 hidden sm:block" />
              
              <div className="hidden sm:flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg">
                <span className="text-xs text-blue-600 font-medium">Session Time</span>
                <span className="text-sm font-bold text-blue-700 font-mono">{formatTime(sessionTime)}</span>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onEndSession}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              End Session
            </Button>
          </div>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-max">

          <div className="lg:col-span-2">
            <MentalStateCard />
          </div>

          <div className="md:col-span-1 lg:col-span-1">
            <BrainwaveBarGraph />
          </div>
          <div className="md:col-span-1 lg:col-span-1">
            <StressGauge />
          </div>

          <div className="md:col-span-2 lg:col-span-2">
            <RealTimeEEG />
          </div>

          <div className="md:col-span-2 lg:col-span-2">
            <FrequencySpectrum />
          </div>
        </div>
      </main>
    </div>
  );
}
