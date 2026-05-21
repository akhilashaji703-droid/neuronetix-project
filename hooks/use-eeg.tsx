'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

export interface BrainwaveBands {
  delta: number;
  theta: number;
  alpha: number;
  beta: number;
  gamma: number;
}

export interface MentalState {
  state: 'Relaxed' | 'Neutral' | 'Focused' | 'Stressed';
  confidence: number;
  timestamp: number;
}

export interface FrequencyPoint {
  frequency: number;
  magnitude: number;
}

export interface EEGStreamData {
  timestamp: number;
  raw_signal: number[];
  signal_quality: number;
  brainwaves: BrainwaveBands;
  mental_state: MentalState;
  stress_level: number;
  frequency_spectrum: FrequencyPoint[];
}

export interface ConnectionStatus {
  connected: boolean;
  port: string;
  sampling_rate: number;
  signal_quality: number;
  message: string;
}

interface EEGContextType {
  isConnected: boolean;
  isStreaming: boolean;
  connectionStatus: ConnectionStatus | null;
  
  eegData: EEGStreamData | null;
  signalHistory: { time: number; signal: number }[];
  
  connect: (simulate?: boolean) => Promise<boolean>;
  disconnect: () => Promise<void>;
  startStreaming: () => void;
  stopStreaming: () => void;
}

const EEGContext = createContext<EEGContextType | null>(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export function EEGProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [eegData, setEegData] = useState<EEGStreamData | null>(null);
  const [signalHistory, setSignalHistory] = useState<{ time: number; signal: number }[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timeCounterRef = useRef(0);
  const connect = useCallback(async (simulate: boolean = false): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/connect?simulate=${simulate}`, {
        method: 'POST',
      });
      
      const status: ConnectionStatus = await response.json();
      setConnectionStatus(status);
      
      if (status.connected) {
        setIsConnected(true);
        connectWebSocket();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to connect:', error);
      setConnectionStatus({
        connected: false,
        port: '',
        sampling_rate: 256,
        signal_quality: 0,
        message: `Connection error: ${error}`,
      });
      return false;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      await fetch(`${API_URL}/disconnect`, { method: 'POST' });
      
      setIsConnected(false);
      setIsStreaming(false);
      setConnectionStatus(null);
      setEegData(null);
      setSignalHistory([]);
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const ws = new WebSocket(`${WS_URL}/ws/eeg`);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      wsRef.current = ws;
    };
    
    ws.onmessage = (event) => {
      try {
        const data: EEGStreamData = JSON.parse(event.data);
        setEegData(data);
        
        const newSignalPoints = data.raw_signal
          .filter((_, i) => i % 10 === 0)
          .map((signal, i) => ({
            time: timeCounterRef.current + i,
            signal: signal,
          }));
        
        timeCounterRef.current += newSignalPoints.length;
        
        setSignalHistory((prev) => {
          const updated = [...prev, ...newSignalPoints];
          return updated.slice(-256);
        });
        
        setConnectionStatus((prev) => prev ? {
          ...prev,
          signal_quality: data.signal_quality,
        } : null);
        
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      wsRef.current = null;
      
      if (isConnected && !reconnectTimeoutRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = null;
          connectWebSocket();
        }, 2000);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [isConnected]);

  const startStreaming = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ command: 'start' }));
      setIsStreaming(true);
    }
  }, []);

  const stopStreaming = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ command: 'stop' }));
      setIsStreaming(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const value: EEGContextType = {
    isConnected,
    isStreaming,
    connectionStatus,
    eegData,
    signalHistory,
    connect,
    disconnect,
    startStreaming,
    stopStreaming,
  };

  return (
    <EEGContext.Provider value={value}>
      {children}
    </EEGContext.Provider>
  );
}

export function useEEG() {
  const context = useContext(EEGContext);
  if (!context) {
    throw new Error('useEEG must be used within an EEGProvider');
  }
  return context;
}
