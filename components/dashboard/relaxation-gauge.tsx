'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function RelaxationGauge() {
  const [relaxationLevel, setRelaxationLevel] = useState(65);

  useEffect(() => {
    const interval = setInterval(() => {
      setRelaxationLevel((prev) => {
        const change = (Math.random() - 0.5) * 10;
        const newValue = Math.max(0, Math.min(100, prev + change));
        return Math.round(newValue);
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const getRelaxationColor = (level: number) => {
    if (level >= 70) return '#16a34a'; // Green - High relaxation
    if (level >= 40) return '#f59e0b'; // Yellow - Moderate relaxation
    return '#dc2626'; // Red - Low relaxation/stressed
  };

  const getRelaxationLevel = (level: number) => {
    if (level >= 70) return 'Highly Relaxed';
    if (level >= 40) return 'Moderately Relaxed';
    return 'Tense';
  };

  const getGradientId = (level: number) => {
    if (level >= 70) return 'highRelaxGradient';
    if (level >= 40) return 'moderateRelaxGradient';
    return 'lowRelaxGradient';
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (relaxationLevel / 100) * circumference;

  return (
    <Card className="bg-white shadow-lg border-gray-200 hover:shadow-xl transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Relaxation Level</h3>
            <p className="text-sm text-gray-500">Mental state monitoring</p>
          </div>
          <div className="text-2xl">🧘</div>
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
                stroke={`url(#${getGradientId(relaxationLevel)})`}
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
              />
              <defs>
                <linearGradient id="highRelaxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#16a34a" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
                <linearGradient id="moderateRelaxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
                <linearGradient id="lowRelaxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#dc2626" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-bold mb-1" style={{ color: getRelaxationColor(relaxationLevel) }}>
                {relaxationLevel}%
              </p>
              <p className="text-sm font-medium text-gray-600">Relaxed</p>
            </div>
          </div>
        </div>

        {/* Relaxation level indicator */}
        <div className="space-y-3">
          <div className="flex justify-between text-xs font-medium text-gray-600">
            <span>Tense</span>
            <span>Relaxed</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ 
                width: `${relaxationLevel}%`,
                backgroundColor: getRelaxationColor(relaxationLevel)
              }}
            />
          </div>
          
          {/* Status indicator */}
          <div className="text-center mt-4">
            <p className="text-lg font-semibold" style={{ color: getRelaxationColor(relaxationLevel) }}>
              {getRelaxationLevel(relaxationLevel)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {relaxationLevel >= 70 && 'Excellent mental state for focus and creativity'}
              {relaxationLevel >= 40 && relaxationLevel < 70 && 'Good balance between alertness and calm'}
              {relaxationLevel < 40 && 'Consider relaxation techniques or break'}
            </p>
          </div>

          {/* Relaxation indicators */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className={`text-center p-2 rounded-lg transition-colors ${relaxationLevel < 40 ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
              <div className="w-3 h-3 rounded-full bg-red-500 mx-auto mb-1"></div>
              <span className="text-xs font-medium text-gray-600">Tense</span>
            </div>
            <div className={`text-center p-2 rounded-lg transition-colors ${relaxationLevel >= 40 && relaxationLevel < 70 ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
              <div className="w-3 h-3 rounded-full bg-yellow-500 mx-auto mb-1"></div>
              <span className="text-xs font-medium text-gray-600">Moderate</span>
            </div>
            <div className={`text-center p-2 rounded-lg transition-colors ${relaxationLevel >= 70 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
              <div className="w-3 h-3 rounded-full bg-green-500 mx-auto mb-1"></div>
              <span className="text-xs font-medium text-gray-600">Relaxed</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
