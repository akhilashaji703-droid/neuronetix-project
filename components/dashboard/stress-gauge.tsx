'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useEEG } from '@/hooks/use-eeg';

export default function StressGauge() {
  const { eegData } = useEEG();
  const [stressLevel, setStressLevel] = useState(0);

  useEffect(() => {
    // Update from WebSocket data
    if (eegData?.stress_level !== undefined) {
      setStressLevel(Math.round(eegData.stress_level));
    }
  }, [eegData]);

  const getStressColor = (level: number) => {
    if (level <= 30) return '#16a34a'; // Green - Low stress
    if (level <= 60) return '#f59e0b'; // Yellow - Moderate stress
    return '#dc2626'; // Red - High stress
  };

  const getStressLevel = (level: number) => {
    if (level <= 30) return 'Low';
    if (level <= 60) return 'Moderate';
    return 'High';
  };

  const getGradientId = (level: number) => {
    if (level <= 30) return 'lowStressGradient';
    if (level <= 60) return 'moderateStressGradient';
    return 'highStressGradient';
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (stressLevel / 100) * circumference;

  return (
    <Card className="bg-white shadow-lg border-gray-200 hover:shadow-xl transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Stress Level</h3>
            <p className="text-sm text-gray-500">Real-time monitoring</p>
          </div>
          <div className="text-2xl">🧠</div>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="relative w-40 h-40 mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="3"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={`url(#${getGradientId(stressLevel)})`}
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
              />
              <defs>
                <linearGradient id="lowStressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#16a34a" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
                <linearGradient id="moderateStressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
                <linearGradient id="highStressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#dc2626" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-bold mb-1" style={{ color: getStressColor(stressLevel) }}>
                {stressLevel}%
              </p>
              <p className="text-sm font-medium text-gray-600">{getStressLevel(stressLevel)}</p>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}