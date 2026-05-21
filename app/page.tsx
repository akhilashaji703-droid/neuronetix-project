'use client';

import { useState, useCallback, useRef } from 'react';
import { PatientForm, VerifyPatient, ConnectingScreen, PatientData } from '@/components/onboarding';
import Dashboard from '@/components/dashboard/dashboard-main';
import SessionSummaryDialog from '@/components/dashboard/session-summary-dialog';
import { useEEG } from '@/hooks/use-eeg';
import { createPatient, startSession, endSession } from '@/lib/api';

type FlowStep = 'patient-form' | 'verify' | 'connecting' | 'dashboard';

export default function Home() {
  const [currentStep, setCurrentStep] = useState<FlowStep>('patient-form');
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [endedSessionId, setEndedSessionId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const sessionStartTimeRef = useRef<number>(0);
  const { disconnect, stopStreaming } = useEEG();

  // Step 1: Patient form submission
  const handlePatientFormSubmit = async (data: PatientData) => {
    setPatientData(data);
    
    // Save patient to backend
    try {
      await createPatient(data);
    } catch (error) {
      console.error('Failed to save patient:', error);
      // Continue anyway - data will be saved locally
    }
    
    setCurrentStep('verify');
  };

  // Step 2: Go back to edit
  const handleEdit = () => {
    setCurrentStep('patient-form');
  };

  // Step 2: Confirm and proceed to connection
  const handleConfirm = () => {
    setCurrentStep('connecting');
  };

  // Step 3: Connection complete - show dashboard
  const handleConnected = useCallback(async () => {
    // Start a new session
    if (patientData) {
      try {
        const session = await startSession(patientData.patientId);
        sessionIdRef.current = session.sessionId;
        sessionStartTimeRef.current = Date.now();
        console.log('Session started:', session.sessionId);
      } catch (error) {
        console.error('Failed to start session:', error);
      }
    }
    setCurrentStep('dashboard');
  }, [patientData]);

  // End session - show summary dialog
  const handleEndSession = useCallback(async () => {
    // End the current session
    if (patientData && sessionIdRef.current) {
      try {
        stopStreaming();
        await endSession(patientData.patientId, sessionIdRef.current);
        
        // Calculate session duration
        const duration = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
        setSessionDuration(duration);
        setEndedSessionId(sessionIdRef.current);
        
        console.log('Session ended:', sessionIdRef.current);
        
        // Show summary dialog
        setShowSummary(true);
      } catch (error) {
        console.error('Failed to end session:', error);
        // Still show summary even if there's an error
        setShowSummary(true);
      }
    }
    
    // Disconnect from device
    await disconnect();
  }, [patientData, disconnect, stopStreaming]);

  // Handle summary dialog close
  const handleSummaryClose = () => {
    setShowSummary(false);
    setEndedSessionId(null);
    sessionIdRef.current = null;
    setPatientData(null);
    setCurrentStep('patient-form');
  };

  return (
    <>
      {currentStep === 'patient-form' && (
        <PatientForm 
          onSubmit={handlePatientFormSubmit} 
          initialData={patientData || undefined}
        />
      )}
      
      {currentStep === 'verify' && patientData && (
        <VerifyPatient
          patientData={patientData}
          onConfirm={handleConfirm}
          onEdit={handleEdit}
        />
      )}
      
      {currentStep === 'connecting' && patientData && (
        <ConnectingScreen
          patientData={patientData}
          onConnected={handleConnected}
        />
      )}
      
      {currentStep === 'dashboard' && patientData && (
        <Dashboard
          patientData={patientData}
          onEndSession={handleEndSession}
        />
      )}

      {/* Session Summary Dialog */}
      {patientData && endedSessionId && (
        <SessionSummaryDialog
          open={showSummary}
          onClose={handleSummaryClose}
          patientData={patientData}
          sessionId={endedSessionId}
          duration={sessionDuration}
        />
      )}
    </>
  );
}
