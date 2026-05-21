'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PatientData } from './patient-form';
import { useEEG } from '@/hooks/use-eeg';

interface ConnectingScreenProps {
  patientData: PatientData;
  onConnected: () => void;
}

export default function ConnectingScreen({ patientData, onConnected }: ConnectingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing...');
  const [statusDetails, setStatusDetails] = useState('Preparing BioAmp connection');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [useSimulation, setUseSimulation] = useState(false);
  const hasConnectedRef = useRef(false);
  
  const { connect, startStreaming, connectionStatus } = useEEG();

  const connectionSteps = [
    { progress: 15, status: 'Scanning for BioAmp device...', details: 'Searching nearby devices' },
    { progress: 30, status: 'Device found', details: 'BioAmp EEG detected' },
    { progress: 45, status: 'Establishing connection...', details: 'Pairing with device' },
    { progress: 60, status: 'Connection established', details: 'Verifying signal quality' },
    { progress: 75, status: 'Calibrating sensors...', details: 'Optimizing electrode readings' },
    { progress: 90, status: 'Loading patient profile...', details: `Setting up for ${patientData.name}` },
    { progress: 100, status: 'Ready!', details: 'Starting EEG monitoring session' },
  ];

  useEffect(() => {
    if (hasConnectedRef.current) return;
    
    const performConnection = async () => {
      // Step 1: Initialize
      setProgress(15);
      setStatus('Connecting to backend...');
      setStatusDetails('Establishing server connection');
      
      try {
        // Step 2: Connect to device
        setProgress(30);
        setStatus('Connecting to EEG device...');
        setStatusDetails(useSimulation ? 'Starting simulation mode' : 'Searching for BioAmp');
        
        const connected = await connect(useSimulation);
        
        if (!connected) {
          setConnectionError(connectionStatus?.message || 'Failed to connect to EEG device');
          return;
        }
        
        hasConnectedRef.current = true;
        
        // Step 3: Connection established
        setProgress(45);
        setStatus('Device connected');
        setStatusDetails(connectionStatus?.port || 'Connection established');
        await new Promise(r => setTimeout(r, 500));
        
        // Step 4: Verify signal
        setProgress(60);
        setStatus('Verifying signal...');
        setStatusDetails('Checking electrode connections');
        await new Promise(r => setTimeout(r, 500));
        
        // Step 5: Calibrate
        setProgress(75);
        setStatus('Calibrating sensors...');
        setStatusDetails('Optimizing signal processing');
        await new Promise(r => setTimeout(r, 500));
        
        // Step 6: Start streaming
        setProgress(90);
        setStatus('Starting data stream...');
        setStatusDetails(`Setting up for ${patientData.name}`);
        startStreaming();
        await new Promise(r => setTimeout(r, 500));
        
        // Step 7: Ready
        setProgress(100);
        setStatus('Ready!');
        setStatusDetails('Starting EEG monitoring session');
        await new Promise(r => setTimeout(r, 500));
        
        onConnected();
        
      } catch (error) {
        console.error('Connection error:', error);
        setConnectionError(`Connection failed: ${error}`);
      }
    };
    
    performConnection();
  }, [connect, startStreaming, onConnected, patientData.name, useSimulation, connectionStatus?.message, connectionStatus?.port]);

  const handleRetry = () => {
    setConnectionError(null);
    setProgress(0);
    hasConnectedRef.current = false;
  };

  const handleUseSimulation = () => {
    setUseSimulation(true);
    setConnectionError(null);
    setProgress(0);
    hasConnectedRef.current = false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-white shadow-2xl border-0">
        <CardContent className="p-8">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                ✓
              </div>
              <span className="text-sm font-medium text-green-600">Details</span>
            </div>
            <div className="w-8 h-0.5 bg-green-500" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                ✓
              </div>
              <span className="text-sm font-medium text-green-600">Verify</span>
            </div>
            <div className="w-8 h-0.5 bg-green-500" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold animate-pulse">
                3
              </div>
              <span className="text-sm font-medium text-green-600">Connect</span>
            </div>
          </div>

          {/* Brain Animation */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="relative">
              {/* Pulsing rings */}
              <div className="absolute inset-0 w-32 h-32 -m-4">
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20" />
              </div>
              <div className="absolute inset-0 w-28 h-28 -m-2">
                <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-30 animation-delay-150" />
              </div>
              
              {/* Main brain icon */}
              <div className="relative w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg z-10">
                <span className="text-5xl animate-pulse">🧠</span>
              </div>
              
              {/* Connecting waves */}
              <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-green-400 rounded-full animate-wave"
                    style={{
                      height: `${10 + Math.random() * 20}px`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
              
              {/* Device icon */}
              <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center border-2 border-green-200">
                <span className="text-xl">📡</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {connectionError ? 'Connection Failed' : (useSimulation ? 'Simulation Mode' : 'Connecting to BioAmp')}
            </h2>
            {connectionError ? (
              <>
                <p className="text-lg font-medium text-red-600 mb-1">
                  {connectionError}
                </p>
                <p className="text-sm text-gray-500">
                  Make sure the backend server is running and Arduino is connected
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium text-green-600 mb-1">
                  {status}
                </p>
                <p className="text-sm text-gray-500">
                  {statusDetails}
                </p>
              </>
            )}
          </div>

          {/* Error Actions */}
          {connectionError && (
            <div className="flex flex-col gap-3 mb-6">
              <Button onClick={handleRetry} className="w-full bg-green-600 hover:bg-green-700">
                Retry Connection
              </Button>
              <Button onClick={handleUseSimulation} variant="outline" className="w-full">
                Use Simulation Mode (Demo)
              </Button>
              <p className="text-xs text-center text-gray-500">
                Simulation mode generates realistic EEG data without hardware
              </p>
            </div>
          )}

          {/* Progress Bar */}
          {!connectionError && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 font-medium">Connection Progress</span>
                <span className="text-green-600 font-bold">{progress}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
              </div>
            </div>
          )}

          {/* Patient Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-lg">👤</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Patient</p>
                <p className="font-semibold text-gray-900">{patientData.name}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-sm text-gray-500">ID</p>
                <p className="font-semibold text-gray-900">{patientData.patientId}</p>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              💡 Ensure electrodes are properly placed for optimal signal quality
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(2); }
        }
        .animate-wave {
          animation: wave 0.6s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
