"""
Patient Data Manager.

Handles:
- Patient data storage in JSON files
- EEG session data storage in CSV files
- Patient lookup and listing
"""

import json
import csv
import os
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any
import logging
import aiofiles
import asyncio

from config import DATA_DIR
from models import PatientData, SessionInfo, EEGDataPoint

logger = logging.getLogger(__name__)


class PatientManager:
    """Manages patient data and EEG session storage."""
    
    def __init__(self, data_dir: Path = DATA_DIR):
        self.data_dir = data_dir
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
    def _get_patient_dir(self, patient_id: str) -> Path:
        """Get or create patient directory."""
        patient_dir = self.data_dir / patient_id
        patient_dir.mkdir(parents=True, exist_ok=True)
        return patient_dir
    
    def _get_patient_file(self, patient_id: str) -> Path:
        """Get patient JSON file path."""
        return self._get_patient_dir(patient_id) / "patient.json"
    
    def _get_session_dir(self, patient_id: str) -> Path:
        """Get or create sessions directory for a patient."""
        sessions_dir = self._get_patient_dir(patient_id) / "sessions"
        sessions_dir.mkdir(parents=True, exist_ok=True)
        return sessions_dir
    
    async def save_patient(self, patient_data: PatientData) -> bool:
        """
        Save patient data to JSON file.
        Creates: patients/<patient_id>/patient.json
        """
        try:
            patient_file = self._get_patient_file(patient_data.patient_id)
            
            # Add metadata
            data = patient_data.model_dump(by_alias=True)
            data["created_at"] = datetime.now().isoformat()
            data["updated_at"] = datetime.now().isoformat()
            
            # Check if patient exists and preserve created_at
            if patient_file.exists():
                async with aiofiles.open(patient_file, 'r') as f:
                    existing = json.loads(await f.read())
                    data["created_at"] = existing.get("created_at", data["created_at"])
            
            # Write patient data
            async with aiofiles.open(patient_file, 'w') as f:
                await f.write(json.dumps(data, indent=2))
            
            logger.info(f"Saved patient data for {patient_data.patient_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving patient data: {e}")
            return False
    
    async def get_patient(self, patient_id: str) -> Optional[Dict[str, Any]]:
        """Get patient data by ID."""
        try:
            patient_file = self._get_patient_file(patient_id)
            
            if not patient_file.exists():
                return None
            
            async with aiofiles.open(patient_file, 'r') as f:
                data = json.loads(await f.read())
            
            return data
            
        except Exception as e:
            logger.error(f"Error reading patient data: {e}")
            return None
    
    async def list_patients(self) -> List[Dict[str, Any]]:
        """List all patients."""
        patients = []
        
        try:
            for patient_dir in self.data_dir.iterdir():
                if patient_dir.is_dir():
                    patient_file = patient_dir / "patient.json"
                    if patient_file.exists():
                        async with aiofiles.open(patient_file, 'r') as f:
                            data = json.loads(await f.read())
                            patients.append(data)
            
            # Sort by updated_at (most recent first)
            patients.sort(
                key=lambda x: x.get("updated_at", ""), 
                reverse=True
            )
            
        except Exception as e:
            logger.error(f"Error listing patients: {e}")
        
        return patients
    
    async def delete_patient(self, patient_id: str) -> bool:
        """Delete patient and all associated data."""
        try:
            import shutil
            patient_dir = self._get_patient_dir(patient_id)
            
            if patient_dir.exists():
                shutil.rmtree(patient_dir)
                logger.info(f"Deleted patient {patient_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error deleting patient: {e}")
            return False
    
    async def create_session(self, patient_id: str) -> SessionInfo:
        """
        Create a new EEG session for a patient.
        Returns session info with generated ID.
        """
        session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        session = SessionInfo(
            session_id=session_id,
            patient_id=patient_id,
            start_time=datetime.now()
        )
        
        # Create session directory
        session_dir = self._get_session_dir(patient_id) / session_id
        session_dir.mkdir(parents=True, exist_ok=True)
        
        # Save session info
        session_file = session_dir / "session.json"
        async with aiofiles.open(session_file, 'w') as f:
            await f.write(session.model_dump_json(indent=2))
        
        # Create EEG data file with header
        eeg_file = session_dir / "eeg_data.csv"
        async with aiofiles.open(eeg_file, 'w') as f:
            await f.write("timestamp,raw_value,filtered_value\n")
        
        logger.info(f"Created session {session_id} for patient {patient_id}")
        return session
    
    async def append_eeg_data(
        self, 
        patient_id: str, 
        session_id: str, 
        data_points: List[EEGDataPoint]
    ) -> bool:
        """
        Append EEG data points to session CSV file.
        Writes to: patients/<patient_id>/sessions/<session_id>/eeg_data.csv
        """
        try:
            session_dir = self._get_session_dir(patient_id) / session_id
            eeg_file = session_dir / "eeg_data.csv"
            
            async with aiofiles.open(eeg_file, 'a') as f:
                for point in data_points:
                    line = f"{point.timestamp},{point.value},{point.filtered_value}\n"
                    await f.write(line)
            
            return True
            
        except Exception as e:
            logger.error(f"Error appending EEG data: {e}")
            return False
    
    async def end_session(
        self, 
        patient_id: str, 
        session_id: str, 
        notes: str = ""
    ) -> Optional[SessionInfo]:
        """
        End a session and update its metadata.
        """
        try:
            session_dir = self._get_session_dir(patient_id) / session_id
            session_file = session_dir / "session.json"
            
            if not session_file.exists():
                return None
            
            # Read existing session
            async with aiofiles.open(session_file, 'r') as f:
                data = json.loads(await f.read())
            
            # Update end time and duration
            start_time = datetime.fromisoformat(data["start_time"])
            end_time = datetime.now()
            duration = int((end_time - start_time).total_seconds())
            
            data["end_time"] = end_time.isoformat()
            data["duration_seconds"] = duration
            data["notes"] = notes
            
            # Save updated session
            async with aiofiles.open(session_file, 'w') as f:
                await f.write(json.dumps(data, indent=2))
            
            # Count EEG samples
            eeg_file = session_dir / "eeg_data.csv"
            if eeg_file.exists():
                async with aiofiles.open(eeg_file, 'r') as f:
                    content = await f.read()
                    sample_count = len(content.strip().split('\n')) - 1  # Minus header
                    data["sample_count"] = sample_count
            
            logger.info(f"Ended session {session_id}: {duration}s, {data.get('sample_count', 0)} samples")
            
            return SessionInfo(**data)
            
        except Exception as e:
            logger.error(f"Error ending session: {e}")
            return None
    
    async def get_session(self, patient_id: str, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session info and data."""
        try:
            session_dir = self._get_session_dir(patient_id) / session_id
            session_file = session_dir / "session.json"
            
            if not session_file.exists():
                return None
            
            async with aiofiles.open(session_file, 'r') as f:
                data = json.loads(await f.read())
            
            return data
            
        except Exception as e:
            logger.error(f"Error getting session: {e}")
            return None
    
    async def list_sessions(self, patient_id: str) -> List[Dict[str, Any]]:
        """List all sessions for a patient."""
        sessions = []
        
        try:
            sessions_dir = self._get_session_dir(patient_id)
            
            for session_dir in sessions_dir.iterdir():
                if session_dir.is_dir():
                    session_file = session_dir / "session.json"
                    if session_file.exists():
                        async with aiofiles.open(session_file, 'r') as f:
                            data = json.loads(await f.read())
                            sessions.append(data)
            
            # Sort by start_time (most recent first)
            sessions.sort(
                key=lambda x: x.get("start_time", ""), 
                reverse=True
            )
            
        except Exception as e:
            logger.error(f"Error listing sessions: {e}")
        
        return sessions
    
    async def get_eeg_data(
        self, 
        patient_id: str, 
        session_id: str,
        start_time: Optional[float] = None,
        end_time: Optional[float] = None
    ) -> List[EEGDataPoint]:
        """
        Read EEG data from session CSV file.
        Optionally filter by time range.
        """
        data_points = []
        
        try:
            session_dir = self._get_session_dir(patient_id) / session_id
            eeg_file = session_dir / "eeg_data.csv"
            
            if not eeg_file.exists():
                return []
            
            async with aiofiles.open(eeg_file, 'r') as f:
                content = await f.read()
            
            lines = content.strip().split('\n')[1:]  # Skip header
            
            for line in lines:
                parts = line.split(',')
                if len(parts) >= 3:
                    timestamp = float(parts[0])
                    
                    # Apply time filter if specified
                    if start_time and timestamp < start_time:
                        continue
                    if end_time and timestamp > end_time:
                        continue
                    
                    data_points.append(EEGDataPoint(
                        timestamp=timestamp,
                        value=float(parts[1]),
                        filtered_value=float(parts[2])
                    ))
            
        except Exception as e:
            logger.error(f"Error reading EEG data: {e}")
        
        return data_points
