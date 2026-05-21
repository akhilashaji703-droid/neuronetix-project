// Patient API client for interacting with the backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface PatientData {
  name: string;
  patientId: string;
  age: string;
  gender: string;
  phone: string;
  email: string;
  emergencyContact: string;
  medicalHistory: string;
}

export interface SessionData {
  session_id: string;
  patient_id: string;
  start_time: string;
  end_time?: string;
  duration_seconds: number;
  notes: string;
  sample_count?: number;
}

// Patient API functions
export async function createPatient(patient: PatientData): Promise<{ status: string; patientId: string }> {
  const response = await fetch(`${API_URL}/patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patient),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create patient: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getPatient(patientId: string): Promise<PatientData | null> {
  const response = await fetch(`${API_URL}/patients/${patientId}`);
  
  if (response.status === 404) {
    return null;
  }
  
  if (!response.ok) {
    throw new Error(`Failed to get patient: ${response.statusText}`);
  }
  
  return response.json();
}

export async function listPatients(): Promise<PatientData[]> {
  const response = await fetch(`${API_URL}/patients`);
  
  if (!response.ok) {
    throw new Error(`Failed to list patients: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.patients;
}

export async function deletePatient(patientId: string): Promise<void> {
  const response = await fetch(`${API_URL}/patients/${patientId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete patient: ${response.statusText}`);
  }
}

// Session API functions
export async function startSession(patientId: string): Promise<{ sessionId: string; patientId: string }> {
  const response = await fetch(`${API_URL}/patients/${patientId}/sessions`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to start session: ${response.statusText}`);
  }
  
  return response.json();
}

export async function endSession(patientId: string, sessionId: string, notes?: string): Promise<SessionData> {
  const url = new URL(`${API_URL}/patients/${patientId}/sessions/${sessionId}/end`);
  if (notes) {
    url.searchParams.set('notes', notes);
  }
  
  const response = await fetch(url.toString(), {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to end session: ${response.statusText}`);
  }
  
  return response.json();
}

export async function listSessions(patientId: string): Promise<SessionData[]> {
  const response = await fetch(`${API_URL}/patients/${patientId}/sessions`);
  
  if (!response.ok) {
    throw new Error(`Failed to list sessions: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.sessions;
}

export async function getSession(patientId: string, sessionId: string): Promise<SessionData | null> {
  const response = await fetch(`${API_URL}/patients/${patientId}/sessions/${sessionId}`);
  
  if (response.status === 404) {
    return null;
  }
  
  if (!response.ok) {
    throw new Error(`Failed to get session: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getSessionEEGData(
  patientId: string, 
  sessionId: string,
  startTime?: number,
  endTime?: number
): Promise<{ timestamp: number; value: number; filtered_value: number }[]> {
  const url = new URL(`${API_URL}/patients/${patientId}/sessions/${sessionId}/eeg`);
  if (startTime !== undefined) url.searchParams.set('start', startTime.toString());
  if (endTime !== undefined) url.searchParams.set('end', endTime.toString());
  
  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`Failed to get EEG data: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.data;
}

// Session Summary API
export interface SessionSummary {
  ai_generated: boolean;
  model: string;
  analysis: string;
  stats: {
    total_samples: number;
    avg_delta: number;
    avg_theta: number;
    avg_alpha: number;
    avg_beta: number;
    avg_gamma: number;
    relaxed_percent: number;
    neutral_percent: number;
    focused_percent: number;
    stressed_percent: number;
    avg_stress: number;
    min_stress: number;
    max_stress: number;
    avg_signal_quality: number;
  };
  generated_at: string;
}

export async function getSessionSummary(patientId: string, sessionId: string): Promise<SessionSummary> {
  const response = await fetch(`${API_URL}/patients/${patientId}/sessions/${sessionId}/summary`);
  
  if (!response.ok) {
    throw new Error(`Failed to get session summary: ${response.statusText}`);
  }
  
  return response.json();
}

// Connection API functions
export async function connectDevice(simulate: boolean = false): Promise<{
  connected: boolean;
  port: string;
  sampling_rate: number;
  signal_quality: number;
  message: string;
}> {
  const response = await fetch(`${API_URL}/connect?simulate=${simulate}`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to connect: ${response.statusText}`);
  }
  
  return response.json();
}

export async function disconnectDevice(): Promise<void> {
  const response = await fetch(`${API_URL}/disconnect`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to disconnect: ${response.statusText}`);
  }
}

export async function getConnectionStatus(): Promise<{
  connected: boolean;
  port: string;
  sampling_rate: number;
  signal_quality: number;
  message: string;
}> {
  const response = await fetch(`${API_URL}/connection/status`);
  
  if (!response.ok) {
    throw new Error(`Failed to get connection status: ${response.statusText}`);
  }
  
  return response.json();
}
