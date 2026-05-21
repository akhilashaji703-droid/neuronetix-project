'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function BrainwaveBands() {
  const [data, setData] = useState([
    { name: 'Alpha', value: 28 },
    { name: 'Beta', value: 45 },
    { name: 'Gamma', value: 27 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setData([
        { name: 'Alpha', value: Math.round(Math.random() * 40 + 15) },
        { name: 'Beta', value: Math.round(Math.random() * 40 + 30) },
        { name: 'Gamma', value: Math.round(Math.random() * 40 + 10) },
      ]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground mb-4">Brainwave Bands</p>
        
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
            <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
              }}
              formatter={(value) => [`${value}%`, 'Percentage']}
            />
            <Bar dataKey="value" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(139, 92, 246)" />
                <stop offset="100%" stopColor="rgb(59, 130, 246)" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
