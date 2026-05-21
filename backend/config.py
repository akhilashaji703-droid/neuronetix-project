"""
Configuration settings for the NeuroMonitor backend.
"""

import os
from pathlib import Path

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / ".env")
except ImportError:
    pass  # python-dotenv not installed, use system env vars

# Base paths
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "patients"

# Ensure data directory exists
DATA_DIR.mkdir(exist_ok=True)

# Serial port configuration for Arduino
SERIAL_PORT = "/dev/tty.usbmodem1101"
SERIAL_BAUD_RATE = 115200

# EEG Settings
SAMPLING_RATE = 256  # Hz - matches Arduino
EEG_BUFFER_SIZE = 256 * 10  # 10 seconds of data

# WebSocket settings
WS_BROADCAST_RATE = 25  # Hz - how often to send updates to frontend

# Frequency bands for brainwave analysis (Hz)
FREQUENCY_BANDS = {
    "delta": (0.5, 4),
    "theta": (4, 8),
    "alpha": (8, 12),
    "beta": (13, 30),
    "gamma": (30, 45),
}

# Mental state thresholds
MENTAL_STATE_CONFIG = {
    "relaxed": {"alpha_threshold": 0.4, "beta_threshold": 0.2},
    "focused": {"beta_threshold": 0.4, "gamma_threshold": 0.2},
    "stressed": {"beta_threshold": 0.5, "gamma_threshold": 0.3},
}
