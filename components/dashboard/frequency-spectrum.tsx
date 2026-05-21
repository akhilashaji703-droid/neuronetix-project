'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import { useEEG } from '@/hooks/use-eeg';

interface FrequencyData {
  frequency: number;
  magnitude: number;
}

export default function FrequencySpectrum() {
  const { eegData } = useEEG();
  const [data, setData] = useState<FrequencyData[]>([]);

  useEffect(() => {
    // Use real frequency spectrum from WebSocket if available
    if (eegData?.frequency_spectrum && eegData.frequency_spectrum.length > 0) {
      setData(eegData.frequency_spectrum);
    } else {
      // Initialize with zeros when no data
      const initialData = Array.from({ length: 46 }, (_, i) => ({
        frequency: i,
        magnitude: 0,
      }));
      setData(initialData);
    }
  }, [eegData]);

  // Calculate dominant frequency for dynamic coloring
  const dominantFreq = data.reduce((max, point) => 
    point.magnitude > max.magnitude ? point : max, data[0] || { frequency: 0, magnitude: 0 });
  
  const getFrequencyColor = (frequency: number) => {
    if (frequency >= 8 && frequency <= 12) return '#16a34a'; // Green for Alpha (relaxed)
    if (frequency >= 13 && frequency <= 30) return '#f59e0b'; // Yellow for Beta (alert)
    if (frequency >= 31) return '#dc2626'; // Red for Gamma (stress/high activity)
    return '#6b7280'; // Gray for other frequencies
  };

  const getFrequencyBand = (frequency: number) => {
    if (frequency >= 0.5 && frequency <= 4) return 'Delta (Deep Sleep)';
    if (frequency >= 4 && frequency <= 8) return 'Theta (Drowsy)';
    if (frequency >= 8 && frequency <= 12) return 'Alpha (Relaxed)';
    if (frequency >= 13 && frequency <= 30) return 'Beta (Alert)';
    if (frequency >= 31) return 'Gamma (High Activity)';
    return 'Unknown';
  };

  return (
    <Card className="bg-white shadow-lg border-gray-200 hover:shadow-xl transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Frequency Spectrum (FFT)</h3>
            <p className="text-sm text-gray-500">Brainwave frequency analysis</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium" style={{ color: getFrequencyColor(dominantFreq.frequency) }}>
              Dominant: {dominantFreq.frequency}Hz
            </p>
            <p className="text-xs text-gray-500">{getFrequencyBand(dominantFreq.frequency)}</p>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#e5e7eb" opacity={0.7} />
              <XAxis
                dataKey="frequency"
                stroke="#6b7280"
                style={{ fontSize: '11px' }}
                axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                tickLine={{ stroke: '#d1d5db' }}
                label={{ value: 'Frequency (Hz)', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fill: '#6b7280' } }}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '11px' }}
                axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                tickLine={{ stroke: '#d1d5db' }}
                label={{ value: 'Magnitude (dB)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ color: '#374151', fontWeight: '500' }}
                formatter={(value: any, name: any) => [
                  <span style={{ color: getFrequencyColor(dominantFreq.frequency), fontWeight: '600' }}>
                    {typeof value === 'number' ? value.toFixed(1) : value} dB
                  </span>, 
                  'Power'
                ]}
                labelFormatter={(label) => `${label} Hz - ${getFrequencyBand(Number(label))}`}
              />
              
              {/* Alpha band highlight (8-12 Hz) */}
              <ReferenceArea x1={8} x2={12} fill="rgba(34, 197, 94, 0.1)" />
              
              {/* Beta band highlight (13-30 Hz) */}
              <ReferenceArea x1={13} x2={30} fill="rgba(245, 158, 11, 0.1)" />
              
              {/* Gamma band highlight (31+ Hz) */}
              <ReferenceArea x1={31} x2={46} fill="rgba(220, 38, 38, 0.1)" />
              
              <Line
                type="monotone"
                dataKey="magnitude"
                stroke="url(#spectrumGradient)"
                dot={false}
                isAnimationActive={false}
                strokeWidth={2.5}
                filter="drop-shadow(0 1px 2px rgba(0,0,0,0.1))"
              />
              <defs>
                <linearGradient id="spectrumGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6b7280" />
                  <stop offset="17%" stopColor="#6b7280" />
                  <stop offset="18%" stopColor="#16a34a" />
                  <stop offset="26%" stopColor="#16a34a" />
                  <stop offset="28%" stopColor="#f59e0b" />
                  <stop offset="65%" stopColor="#f59e0b" />
                  <stop offset="67%" stopColor="#dc2626" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
            <div>
              <p className="font-medium text-gray-700">Delta/Theta</p>
              <p className="text-gray-500">0.5-8 Hz</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <div>
              <p className="font-medium text-gray-700">Alpha</p>
              <p className="text-gray-500">8-12 Hz</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div>
              <p className="font-medium text-gray-700">Beta</p>
              <p className="text-gray-500">13-30 Hz</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div>
              <p className="font-medium text-gray-700">Gamma</p>
              <p className="text-gray-500">31+ Hz</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
