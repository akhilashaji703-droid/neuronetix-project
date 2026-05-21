"""
Serial Reader Module for Arduino EEG data.

Handles:
- Connection to Arduino via serial port
- Reading EEG data stream
- Auto-reconnection on disconnect
"""

import asyncio
import serial
import serial.tools.list_ports
from typing import Optional, Callable, AsyncGenerator
import logging
import time

from config import SERIAL_PORT, SERIAL_BAUD_RATE, SAMPLING_RATE

logger = logging.getLogger(__name__)


class SerialReader:
    """Async serial reader for Arduino EEG data."""
    
    def __init__(self, port: str = SERIAL_PORT, baud_rate: int = SERIAL_BAUD_RATE):
        self.port = port
        self.baud_rate = baud_rate
        self.serial_conn: Optional[serial.Serial] = None
        self.is_connected = False
        self.is_running = False
        self.last_value = 0.0
        self.samples_received = 0
        self.connection_error = ""
        
    def find_arduino_port(self) -> Optional[str]:
        """Auto-detect Arduino port (Mac/Linux/Windows)."""
        ports = serial.tools.list_ports.comports()
        
        for port in ports:
            device = port.device
            desc = port.description.lower() if port.description else ""
            
            # Common Arduino identifiers in description
            if any(x in desc for x in ['arduino', 'ch340', 'ch341', 'usb serial', 'acm', 'usb modem']):
                logger.info(f"Found Arduino on port: {device}")
                return device
            
            # Linux patterns
            if 'ttyACM' in device or 'ttyUSB' in device:
                logger.info(f"Found potential Arduino on port: {device}")
                return device
            
            # macOS patterns (usbmodem, usbserial)
            if 'usbmodem' in device or 'usbserial' in device:
                logger.info(f"Found potential Arduino on port: {device}")
                return device
        
        return None
    
    def connect(self) -> bool:
        """
        Connect to Arduino serial port.
        Returns True if successful.
        """
        try:
            # Try configured port first
            port = self.port
            
            # Auto-detect if configured port not found
            if not self._port_exists(port):
                detected_port = self.find_arduino_port()
                if detected_port:
                    port = detected_port
                else:
                    self.connection_error = "No Arduino found. Please connect the device."
                    logger.error(self.connection_error)
                    return False
            
            self.serial_conn = serial.Serial(
                port=port,
                baudrate=self.baud_rate,
                timeout=1.0
            )
            
            # Wait for Arduino to reset
            time.sleep(2)
            
            # Clear any startup messages
            self.serial_conn.reset_input_buffer()
            
            # Read and check for "Ready" message
            startup_msg = ""
            for _ in range(10):
                if self.serial_conn.in_waiting:
                    line = self.serial_conn.readline().decode('utf-8', errors='ignore').strip()
                    startup_msg += line + " "
                    if 'Ready' in line or 'EEG' in line:
                        break
                time.sleep(0.1)
            
            self.is_connected = True
            self.port = port
            self.connection_error = ""
            logger.info(f"Connected to Arduino on {port}. Startup: {startup_msg}")
            return True
            
        except serial.SerialException as e:
            self.connection_error = f"Serial error: {str(e)}"
            logger.error(self.connection_error)
            return False
        except Exception as e:
            self.connection_error = f"Connection error: {str(e)}"
            logger.error(self.connection_error)
            return False
    
    def _port_exists(self, port: str) -> bool:
        """Check if a serial port exists."""
        ports = [p.device for p in serial.tools.list_ports.comports()]
        return port in ports
    
    def disconnect(self):
        """Disconnect from Arduino."""
        if self.serial_conn and self.serial_conn.is_open:
            self.serial_conn.close()
        self.is_connected = False
        self.is_running = False
        logger.info("Disconnected from Arduino")
    
    async def read_data(self) -> AsyncGenerator[float, None]:
        """
        Async generator that yields EEG values.
        Handles reconnection on errors.
        """
        self.is_running = True
        
        while self.is_running:
            if not self.is_connected:
                if not self.connect():
                    await asyncio.sleep(2)  # Wait before retry
                    continue
            
            try:
                if self.serial_conn and self.serial_conn.in_waiting:
                    line = self.serial_conn.readline().decode('utf-8', errors='ignore').strip()
                    
                    try:
                        value = float(line)
                        self.last_value = value
                        self.samples_received += 1
                        yield value
                    except ValueError:
                        # Not a number (might be debug message)
                        logger.debug(f"Non-numeric data: {line}")
                        continue
                else:
                    # Small sleep to prevent busy loop
                    await asyncio.sleep(0.001)
                    
            except serial.SerialException as e:
                logger.error(f"Serial read error: {e}")
                self.is_connected = False
                await asyncio.sleep(1)
            except Exception as e:
                logger.error(f"Read error: {e}")
                await asyncio.sleep(0.1)
        
    def stop(self):
        """Stop the reader."""
        self.is_running = False
        self.disconnect()
    
    def get_status(self) -> dict:
        """Get current connection status."""
        return {
            "connected": self.is_connected,
            "port": self.port,
            "sampling_rate": SAMPLING_RATE,
            "samples_received": self.samples_received,
            "last_value": self.last_value,
            "error": self.connection_error
        }


class SimulatedSerialReader:
    """
    Simulated serial reader for testing without hardware.
    Generates realistic EEG-like signals.
    """
    
    def __init__(self, sampling_rate: int = SAMPLING_RATE):
        self.sampling_rate = sampling_rate
        self.is_connected = True
        self.is_running = False
        self.samples_received = 0
        self.last_value = 0.0
        self.time_counter = 0
        
    def connect(self) -> bool:
        """Simulate successful connection."""
        self.is_connected = True
        return True
    
    def disconnect(self):
        """Simulate disconnection."""
        self.is_connected = False
        self.is_running = False
    
    async def read_data(self) -> AsyncGenerator[float, None]:
        """
        Generate simulated EEG data.
        Combines multiple sine waves to simulate brainwave patterns.
        """
        import numpy as np
        
        self.is_running = True
        sample_interval = 1.0 / self.sampling_rate
        
        while self.is_running:
            t = self.time_counter * sample_interval
            
            # Generate composite EEG signal
            # Alpha waves (10 Hz) - dominant when relaxed
            alpha = 30 * np.sin(2 * np.pi * 10 * t)
            
            # Beta waves (20 Hz) - present during focus
            beta = 15 * np.sin(2 * np.pi * 20 * t)
            
            # Theta waves (6 Hz) - drowsiness
            theta = 10 * np.sin(2 * np.pi * 6 * t)
            
            # Delta waves (2 Hz) - deep sleep
            delta = 5 * np.sin(2 * np.pi * 2 * t)
            
            # Gamma waves (40 Hz) - high cognition
            gamma = 8 * np.sin(2 * np.pi * 40 * t)
            
            # Add noise
            noise = np.random.normal(0, 5)
            
            # Combine all
            value = alpha + beta + theta + delta + gamma + noise
            
            # Add occasional artifacts (eye blinks, muscle movement)
            if np.random.random() < 0.01:
                value += np.random.normal(0, 50)
            
            self.last_value = value
            self.samples_received += 1
            self.time_counter += 1
            
            yield value
            
            # Maintain sampling rate
            await asyncio.sleep(sample_interval)
    
    def stop(self):
        """Stop the reader."""
        self.is_running = False
    
    def get_status(self) -> dict:
        """Get current status."""
        return {
            "connected": self.is_connected,
            "port": "SIMULATED",
            "sampling_rate": self.sampling_rate,
            "samples_received": self.samples_received,
            "last_value": self.last_value,
            "error": ""
        }
