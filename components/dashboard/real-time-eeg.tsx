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
} from 'recharts';
import { useEEG } from '@/hooks/use-eeg';

interface DataPoint {
  time: number;
  signal: number;
}

export default function RealTimeEEG() {
  const { signalHistory } = useEEG();
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    if (signalHistory.length > 0) {
      setData(signalHistory);
    } else {
      const initialData = Array.from({ length: 256 }, (_, i) => ({
        time: i,
        signal: 0,
      }));
      setData(initialData);
    }
  }, [signalHistory]);

  const avgSignal = data.length > 0 ? 
    Math.abs(data.slice(-20).reduce((sum, point) => sum + point.signal, 0) / 20) : 0;
  
  const getSignalColor = () => {
    if (avgSignal > 25) return '#dc2626';
    if (avgSignal > 15) return '#f59e0b';
    return '#16a34a'; 
  };

  return (
    <Card className="bg-white shadow-lg border-gray-200 hover:shadow-xl transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Real-Time EEG Signal</h3>
            <p className="text-sm text-gray-500">Live brainwave monitoring</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full animate-pulse`} 
                 style={{ backgroundColor: getSignalColor() }} />
            <span className="text-xs font-medium text-gray-600">
              {avgSignal > 25 ? 'High Activity' : avgSignal > 15 ? 'Moderate' : 'Relaxed'}
            </span>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#e5e7eb" opacity={0.7} />
              <XAxis
                dataKey="time"
                stroke="#6b7280"
                style={{ fontSize: '11px' }}
                interval={30}
                axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                tickLine={{ stroke: '#d1d5db' }}
              />
              <YAxis 
                stroke="#6b7280" 
                style={{ fontSize: '11px' }}
                axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                tickLine={{ stroke: '#d1d5db' }}
                label={{ value: 'Amplitude (μV)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ color: '#374151', fontWeight: '500' }}
                formatter={(value: any) => [
                  <span style={{ color: getSignalColor(), fontWeight: '600' }}>
                    {value?.toFixed(2)} μV
                  </span>, 
                  'Signal'
                ]}
                labelFormatter={(label) => `Time: ${label}ms`}
              />
              <Line
                type="monotone"
                dataKey="signal"
                stroke={getSignalColor()}
                dot={false}
                isAnimationActive={false}
                strokeWidth={2.5}
                filter="drop-shadow(0 1px 2px rgba(0,0,0,0.1))"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-600">Relaxed (0-15μV)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-gray-600">Moderate (15-25μV)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-gray-600">High Activity (25μV+)</span>
            </div>
          </div>
          <span className="text-gray-500">Sample Rate: 25Hz</span>
        </div>
      </CardContent>
    </Card>
  );
}
