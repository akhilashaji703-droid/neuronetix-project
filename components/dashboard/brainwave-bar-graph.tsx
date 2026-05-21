'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useEEG } from '@/hooks/use-eeg';

interface BrainwaveData {
  name: string;
  value: number;
  color: string;
  range: string;
  description: string;
}

export default function BrainwaveBarGraph() {
  const { eegData } = useEEG();
  const [data, setData] = useState<BrainwaveData[]>([
    { name: 'Alpha', value: 0, color: '#16a34a', range: '8-12 Hz', description: 'Relaxed awareness' },
    { name: 'Beta', value: 0, color: '#f59e0b', range: '13-30 Hz', description: 'Active thinking' },
    { name: 'Gamma', value: 0, color: '#dc2626', range: '31+ Hz', description: 'High concentration' },
  ]);

  useEffect(() => {
    if (eegData?.brainwaves) {
      const { alpha, beta, gamma } = eegData.brainwaves;
      setData([
        { name: 'Alpha', value: alpha, color: '#16a34a', range: '8-12 Hz', description: 'Relaxed awareness' },
        { name: 'Beta', value: beta, color: '#f59e0b', range: '13-30 Hz', description: 'Active thinking' },
        { name: 'Gamma', value: gamma, color: '#dc2626', range: '31+ Hz', description: 'High concentration' },
      ]);
    }
  }, [eegData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md">
          <p className="font-semibold text-gray-800">{`${label} Waves`}</p>
          <p className="text-sm text-gray-600">{data.range}</p>
          <p className="text-sm text-gray-500">{data.description}</p>
          <p className="font-bold mt-1" style={{ color: data.color }}>
            {`Activity: ${payload[0].value.toFixed(1)}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomBar = (props: any) => {
    const { fill, ...rest } = props;
    return <Bar {...rest} fill={props.payload.color} />;
  };

  return (
    <Card className="bg-white shadow-lg border-gray-200 hover:shadow-xl transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold text-gray-800">Brainwave Activity</h3>
            <p className="text-xs text-gray-500">Alpha, Beta & Gamma</p>
          </div>
          <div className="text-lg">📊</div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={data} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#e5e7eb" opacity={0.7} />
              <XAxis 
                dataKey="name"
                stroke="#6b7280"
                style={{ fontSize: '10px' }}
                axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                tickLine={{ stroke: '#d1d5db' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '9px' }}
                axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                tickLine={{ stroke: '#d1d5db' }}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-2">
          {data.map((item) => (
            <div key={item.name} className="text-center p-1.5 bg-gray-50 rounded">
              <div className="flex items-center justify-center gap-1 mb-1">
                <div 
                  className="w-2 h-2 rounded"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-medium text-gray-700">{item.name}</span>
              </div>
              <p className="text-sm font-bold" style={{ color: item.color }}>
                {item.value.toFixed(0)}%
              </p>
            </div>
          ))}
        </div>

      
      </CardContent>
    </Card>
  );
}