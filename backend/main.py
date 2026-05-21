"""
NeuroMonitor EEG Backend - Main FastAPI Application

Provides:
- REST API for patient management
- WebSocket for real-time EEG data streaming
- Integration with Arduino for hardware EEG or simulated mode
"""

import asyncio
import time
import logging
from contextlib import asynccontextmanager
from typing import Dict, Set, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config import SAMPLING_RATE, WS_BROADCAST_RATE
from models import (
    PatientData, 
    ConnectionStatus, 
    EEGStreamData,
    BrainwaveBands,
    MentalState,
    EEGDataPoint
)
from eeg_processor import EEGProcessor
from serial_reader import SerialReader, SimulatedSerialReader
from patient_manager import PatientManager

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global state
class AppState:
    def __init__(self):
        self.serial_reader: Optional[SerialReader] = None
        self.eeg_processor: Optional[EEGProcessor] = None
        self.patient_manager: Optional[PatientManager] = None
        self.active_connections: Set[WebSocket] = set()
        self.current_session: Optional[dict] = None
        self.is_streaming = False
        self.use_simulation = False
        self.eeg_data_buffer: list = []
        self.last_broadcast_time = 0

state = AppState()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - setup and cleanup."""
    # Startup
    logger.info("Starting NeuroMonitor backend...")
    state.patient_manager = PatientManager()
    state.eeg_processor = EEGProcessor(SAMPLING_RATE)
    
    yield
    
    # Shutdown
    logger.info("Shutting down NeuroMonitor backend...")
    if state.serial_reader:
        state.serial_reader.stop()
    state.is_streaming = False


# Create FastAPI app
app = FastAPI(
    title="NeuroMonitor EEG API",
    description="Backend API for real-time EEG monitoring and patient management",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# =====================
# REST API Endpoints
# =====================

@app.get("/")
async def root():
    """Root endpoint - API info."""
    return {
        "name": "NeuroMonitor EEG API",
        "version": "1.0.0",
        "status": "running",
        "streaming": state.is_streaming,
        "connections": len(state.active_connections)
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


# ----- Connection Management -----

@app.post("/connect")
async def connect_device(simulate: bool = Query(False, description="Use simulated data")):
    """
    Connect to Arduino EEG device.
    Set simulate=true for testing without hardware.
    """
    state.use_simulation = simulate
    
    if simulate:
        state.serial_reader = SimulatedSerialReader(SAMPLING_RATE)
        connected = state.serial_reader.connect()
        logger.info("Using simulated EEG data")
    else:
        state.serial_reader = SerialReader()
        connected = state.serial_reader.connect()
    
    if not connected and not simulate:
        return ConnectionStatus(
            connected=False,
            port="",
            sampling_rate=SAMPLING_RATE,
            signal_quality=0,
            message=state.serial_reader.connection_error or "Failed to connect"
        )
    
    state.eeg_processor.reset()
    
    return ConnectionStatus(
        connected=True,
        port=state.serial_reader.port if hasattr(state.serial_reader, 'port') else "SIMULATED",
        sampling_rate=SAMPLING_RATE,
        signal_quality=0,
        message="Connected successfully" + (" (Simulation mode)" if simulate else "")
    )


@app.post("/disconnect")
async def disconnect_device():
    """Disconnect from EEG device."""
    if state.serial_reader:
        state.serial_reader.stop()
        state.serial_reader = None
    
    state.is_streaming = False
    
    return {"status": "disconnected"}


@app.get("/connection/status")
async def get_connection_status():
    """Get current connection status."""
    if not state.serial_reader:
        return ConnectionStatus(
            connected=False,
            port="",
            sampling_rate=SAMPLING_RATE,
            signal_quality=0,
            message="Not connected"
        )
    
    status = state.serial_reader.get_status()
    signal_quality = state.eeg_processor.get_signal_quality() if state.eeg_processor else 0
    
    return ConnectionStatus(
        connected=status["connected"],
        port=status["port"],
        sampling_rate=status["sampling_rate"],
        signal_quality=signal_quality,
        message=status.get("error", "") or "Connected"
    )


# ----- Patient Management -----

class PatientRequest(BaseModel):
    """Request model for patient data (camelCase from frontend)."""
    name: str
    patientId: str
    age: str
    gender: str
    phone: str
    email: str = ""
    emergencyContact: str = ""
    medicalHistory: str = ""


@app.post("/patients")
async def create_patient(patient: PatientRequest):
    """Create or update patient record."""
    patient_data = PatientData(
        name=patient.name,
        patientId=patient.patientId,
        age=patient.age,
        gender=patient.gender,
        phone=patient.phone,
        email=patient.email,
        emergencyContact=patient.emergencyContact,
        medicalHistory=patient.medicalHistory
    )
    
    success = await state.patient_manager.save_patient(patient_data)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to save patient data")
    
    return {"status": "success", "patientId": patient.patientId}


@app.get("/patients")
async def list_patients():
    """List all patients."""
    patients = await state.patient_manager.list_patients()
    return {"patients": patients}


@app.get("/patients/{patient_id}")
async def get_patient(patient_id: str):
    """Get patient by ID."""
    patient = await state.patient_manager.get_patient(patient_id)
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return patient


@app.delete("/patients/{patient_id}")
async def delete_patient(patient_id: str):
    """Delete patient and all associated data."""
    success = await state.patient_manager.delete_patient(patient_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return {"status": "deleted", "patientId": patient_id}


# ----- Session Management -----

@app.post("/patients/{patient_id}/sessions")
async def start_session(patient_id: str):
    """Start a new EEG recording session for a patient."""
    # Verify patient exists
    patient = await state.patient_manager.get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Create session
    session = await state.patient_manager.create_session(patient_id)
    
    # Store current session info
    state.current_session = {
        "patient_id": patient_id,
        "session_id": session.session_id,
        "start_time": time.time()
    }
    
    return {
        "status": "session_started",
        "sessionId": session.session_id,
        "patientId": patient_id
    }


@app.post("/patients/{patient_id}/sessions/{session_id}/end")
async def end_session(patient_id: str, session_id: str, notes: str = ""):
    """End the current EEG recording session."""
    session = await state.patient_manager.end_session(patient_id, session_id, notes)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Save any buffered data
    if state.eeg_data_buffer:
        await state.patient_manager.append_eeg_data(
            patient_id, 
            session_id, 
            state.eeg_data_buffer
        )
        state.eeg_data_buffer.clear()
    
    state.current_session = None
    
    return {
        "status": "session_ended",
        "sessionId": session_id,
        "duration": session.duration_seconds
    }


@app.get("/patients/{patient_id}/sessions/{session_id}/summary")
async def get_session_summary(patient_id: str, session_id: str):
    """
    Generate an AI-powered summary of the EEG session using Gemini API.
    """
    from gemini_service import generate_session_summary, calculate_session_stats
    
    # Get patient data
    patient = await state.patient_manager.get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Get session data
    session = await state.patient_manager.get_session(patient_id, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get EEG data for stats calculation
    eeg_data = await state.patient_manager.get_eeg_data(patient_id, session_id)
    
    # Calculate session statistics
    eeg_stats = await calculate_session_stats(eeg_data)
    
    # Generate AI summary
    summary = await generate_session_summary(patient, session, eeg_stats)
    
    return summary


@app.get("/patients/{patient_id}/sessions")
async def list_sessions(patient_id: str):
    """List all sessions for a patient."""
    sessions = await state.patient_manager.list_sessions(patient_id)
    return {"sessions": sessions}


@app.get("/patients/{patient_id}/sessions/{session_id}")
async def get_session(patient_id: str, session_id: str):
    """Get session details."""
    session = await state.patient_manager.get_session(patient_id, session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session


@app.get("/patients/{patient_id}/sessions/{session_id}/eeg")
async def get_session_eeg_data(
    patient_id: str, 
    session_id: str,
    start: Optional[float] = None,
    end: Optional[float] = None
):
    """Get EEG data for a session."""
    data = await state.patient_manager.get_eeg_data(
        patient_id, 
        session_id,
        start_time=start,
        end_time=end
    )
    
    return {"data": [d.model_dump() for d in data]}


# =====================
# WebSocket Endpoint
# =====================

@app.websocket("/ws/eeg")
async def websocket_eeg(websocket: WebSocket):
    """
    WebSocket endpoint for real-time EEG streaming.
    
    Sends EEGStreamData JSON at WS_BROADCAST_RATE Hz containing:
    - Raw signal samples
    - Signal quality
    - Brainwave band powers
    - Mental state detection
    - Stress level
    - Frequency spectrum
    """
    await websocket.accept()
    state.active_connections.add(websocket)
    logger.info(f"WebSocket connected. Total connections: {len(state.active_connections)}")
    
    streaming_task = None
    try:
        # Start streaming task
        streaming_task = asyncio.create_task(stream_eeg_data(websocket))
        
        # Handle incoming messages (e.g., commands)
        while True:
            try:
                data = await websocket.receive_json()
                
                if data.get("command") == "start":
                    if not state.is_streaming and state.serial_reader:
                        state.is_streaming = True
                        logger.info("Streaming started via WebSocket command")
                
                elif data.get("command") == "stop":
                    state.is_streaming = False
                    logger.info("Streaming stopped via WebSocket command")
                
                elif data.get("command") == "ping":
                    await websocket.send_json({"type": "pong", "timestamp": time.time()})
                    
            except WebSocketDisconnect:
                logger.info("WebSocket client disconnected")
                break
            except Exception as e:
                if "disconnect" in str(e).lower():
                    logger.info("WebSocket disconnected")
                    break
                logger.error(f"Error processing WebSocket message: {e}")
                break
                
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        state.active_connections.discard(websocket)
        if streaming_task:
            streaming_task.cancel()
            try:
                await streaming_task
            except asyncio.CancelledError:
                pass
        logger.info(f"WebSocket cleaned up. Remaining connections: {len(state.active_connections)}")


async def stream_eeg_data(websocket: WebSocket):
    """
    Background task to stream EEG data to a WebSocket client.
    """
    broadcast_interval = 1.0 / WS_BROADCAST_RATE
    signal_buffer = []
    
    while True:
        try:
            if not state.is_streaming or not state.serial_reader:
                await asyncio.sleep(0.1)
                continue
            
            # Read samples from serial
            current_time = time.time()
            
            async for value in state.serial_reader.read_data():
                # Process sample
                filtered_value = state.eeg_processor.add_sample(value)
                signal_buffer.append(filtered_value)
                
                # Store for session recording
                if state.current_session:
                    state.eeg_data_buffer.append(EEGDataPoint(
                        timestamp=current_time,
                        value=value,
                        filtered_value=filtered_value
                    ))
                    
                    # Flush buffer periodically
                    if len(state.eeg_data_buffer) >= 256:
                        await state.patient_manager.append_eeg_data(
                            state.current_session["patient_id"],
                            state.current_session["session_id"],
                            state.eeg_data_buffer.copy()
                        )
                        state.eeg_data_buffer.clear()
                
                # Check if it's time to broadcast
                if current_time - state.last_broadcast_time >= broadcast_interval:
                    state.last_broadcast_time = current_time
                    
                    # Get analysis results
                    bands = state.eeg_processor.get_band_powers()
                    mental_state, confidence = state.eeg_processor.detect_mental_state()
                    stress = state.eeg_processor.calculate_stress_level()
                    spectrum = state.eeg_processor.get_frequency_spectrum()
                    quality = state.eeg_processor.get_signal_quality()
                    recent_signal = state.eeg_processor.get_recent_signal(256)
                    
                    # Build stream data
                    stream_data = EEGStreamData(
                        timestamp=current_time,
                        raw_signal=recent_signal,
                        signal_quality=quality,
                        brainwaves=BrainwaveBands(
                            delta=bands["delta"],
                            theta=bands["theta"],
                            alpha=bands["alpha"],
                            beta=bands["beta"],
                            gamma=bands["gamma"]
                        ),
                        mental_state=MentalState(
                            state=mental_state,
                            confidence=confidence,
                            timestamp=current_time
                        ),
                        stress_level=stress,
                        frequency_spectrum=spectrum
                    )
                    
                    # Send to client
                    await websocket.send_json(stream_data.model_dump())
                    signal_buffer.clear()
                
                current_time = time.time()
                
                if not state.is_streaming:
                    break
                    
        except WebSocketDisconnect:
            break
        except Exception as e:
            logger.error(f"Error in EEG streaming: {e}")
            await asyncio.sleep(0.5)


# =====================
# Run Server
# =====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
