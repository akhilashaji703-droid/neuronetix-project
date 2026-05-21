'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useEEG } from '@/hooks/use-eeg';

type MentalState = 'Relaxed' | 'Neutral' | 'Focused' | 'Stressed';

export default function MentalStateCard() {
  const { eegData } = useEEG();
  const [state, setState] = useState<MentalState>('Neutral');
  const [confidence, setConfidence] = useState(0);

  useEffect(() => {
    // Update from WebSocket data
    if (eegData?.mental_state) {
      setState(eegData.mental_state.state);
      setConfidence(Math.round(eegData.mental_state.confidence * 100));
    }
  }, [eegData]);

  const getConfig = (state: MentalState) => {
    switch (state) {
      case 'Relaxed':
        return { color: '#16a34a', emoji: '😌', desc: 'Mind is calm and at ease' };
      case 'Neutral':
        return { color: '#6b7280', emoji: '😐', desc: 'Normal baseline activity' };
      case 'Focused':
        return { color: '#f59e0b', emoji: '🎯', desc: 'High concentration detected' };
      case 'Stressed':
        return { color: '#dc2626', emoji: '😰', desc: 'Elevated stress markers' };
    }
  };

  const config = getConfig(state);

  return (
    <Card className="bg-white shadow-lg border-gray-200 hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Mental State</h3>
            <p className="text-sm text-gray-500">AI-driven detection</p>
          </div>
          <span className="text-3xl">{config.emoji}</span>
        </div>
        
        <div className="text-center py-4">
          <p className="text-4xl font-bold mb-2" style={{ color: config.color }}>{state}</p>
          <p className="text-sm text-gray-500">{config.desc}</p>
        </div>

        {/* Confidence bar */}
        <div className="space-y-2 mt-4">
          <div className="flex justify-between text-xs font-medium text-gray-600">
            <span>Confidence</span>
            <span>{confidence}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ 
                width: `${confidence}%`,
                backgroundColor: config.color
              }}
            />
          </div>
        </div>

        {/* State indicators */}
        <div className="flex justify-between mt-4 gap-2">
          {(['Relaxed', 'Neutral', 'Focused', 'Stressed'] as MentalState[]).map((s) => {
            const c = getConfig(s);
            return (
              <div key={s} className={`flex-1 text-center p-1.5 rounded-md text-xs transition-all ${
                state === s ? `font-bold border` : 'opacity-50'
              }`}
              style={state === s ? { borderColor: c.color, backgroundColor: `${c.color}10` } : {}}>
                <span style={{ color: state === s ? c.color : '#9ca3af' }}>{s}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
