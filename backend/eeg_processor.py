"""
EEG Signal Processing Module.

Handles:
- Real-time signal filtering
- FFT for frequency spectrum analysis
- Brainwave band power extraction
- Mental state detection
- Stress level calculation
"""

import numpy as np
from scipy import signal
from scipy.fft import fft, fftfreq
from typing import List, Tuple, Dict
from collections import deque
import time

from config import SAMPLING_RATE, FREQUENCY_BANDS, EEG_BUFFER_SIZE


class EEGProcessor:
    """Real-time EEG signal processor."""
    
    def __init__(self, sampling_rate: int = SAMPLING_RATE):
        self.sampling_rate = sampling_rate
        self.buffer = deque(maxlen=EEG_BUFFER_SIZE)
        self.filtered_buffer = deque(maxlen=EEG_BUFFER_SIZE)
        
        # Design bandpass filter (0.5 - 45 Hz for EEG)
        self.b, self.a = signal.butter(
            4, 
            [0.5, 45], 
            btype='bandpass', 
            fs=sampling_rate
        )
        
        # Filter state for real-time filtering
        self.zi = signal.lfilter_zi(self.b, self.a)
        
        # For smoothing mental state transitions
        self.mental_state_history = deque(maxlen=10)
        self.stress_history = deque(maxlen=20)
        
    def add_sample(self, value: float) -> float:
        """Add a new sample and return filtered value."""
        self.buffer.append(value)
        
        # Apply filter
        filtered, self.zi = signal.lfilter(
            self.b, self.a, [value], zi=self.zi
        )
        filtered_value = filtered[0]
        self.filtered_buffer.append(filtered_value)
        
        return filtered_value
    
    def get_frequency_spectrum(self, n_points: int = 256) -> List[Dict[str, float]]:
        """
        Compute FFT and return frequency spectrum data.
        Returns list of {frequency, magnitude} pairs.
        """
        if len(self.filtered_buffer) < n_points:
            # Not enough data yet, return zeros
            return [{"frequency": i, "magnitude": 0} for i in range(46)]
        
        # Get last n_points samples
        data = np.array(list(self.filtered_buffer)[-n_points:])
        
        # Apply Hanning window to reduce spectral leakage
        window = np.hanning(len(data))
        data_windowed = data * window
        
        # Compute FFT
        yf = fft(data_windowed)
        xf = fftfreq(len(data), 1 / self.sampling_rate)
        
        # Get positive frequencies only
        positive_mask = xf >= 0
        xf = xf[positive_mask]
        yf = np.abs(yf[positive_mask])
        
        # Normalize magnitude
        yf = yf / len(data) * 2
        
        # Return data for 0-45 Hz range
        spectrum = []
        for i in range(46):
            # Find closest frequency bin
            idx = np.argmin(np.abs(xf - i))
            magnitude = float(yf[idx]) if idx < len(yf) else 0
            # Scale for visualization (0-100 range)
            magnitude = min(100, magnitude * 10)
            spectrum.append({"frequency": i, "magnitude": magnitude})
        
        return spectrum
    
    def get_band_powers(self) -> Dict[str, float]:
        """
        Calculate power in each frequency band.
        Returns normalized powers (0-100 scale).
        """
        if len(self.filtered_buffer) < 256:
            return {"delta": 0, "theta": 0, "alpha": 0, "beta": 0, "gamma": 0}
        
        data = np.array(list(self.filtered_buffer)[-256:])
        
        # Compute PSD using Welch's method
        freqs, psd = signal.welch(
            data, 
            fs=self.sampling_rate, 
            nperseg=min(256, len(data))
        )
        
        band_powers = {}
        total_power = np.sum(psd) + 1e-10  # Avoid division by zero
        
        for band_name, (low, high) in FREQUENCY_BANDS.items():
            # Find frequency indices in band range
            band_mask = (freqs >= low) & (freqs <= high)
            band_power = np.sum(psd[band_mask])
            # Normalize to percentage
            band_powers[band_name] = float(band_power / total_power * 100)
        
        return band_powers
    
    def detect_mental_state(self) -> Tuple[str, float]:
        """
        Detect mental state based on brainwave patterns.
        Returns (state, confidence).
        """
        bands = self.get_band_powers()
        
        # Calculate ratios
        alpha = bands.get("alpha", 0)
        beta = bands.get("beta", 0)
        theta = bands.get("theta", 0)
        gamma = bands.get("gamma", 0)
        
        total = alpha + beta + theta + gamma + 1e-10
        
        # Normalize
        alpha_ratio = alpha / total
        beta_ratio = beta / total
        theta_ratio = theta / total
        gamma_ratio = gamma / total
        
        # Determine state based on dominant patterns
        state = "Neutral"
        confidence = 0.5
        
        # High alpha = Relaxed
        if alpha_ratio > 0.35 and beta_ratio < 0.3:
            state = "Relaxed"
            confidence = 0.6 + alpha_ratio * 0.4
        
        # High beta = Focused
        elif beta_ratio > 0.35 and gamma_ratio > 0.1:
            state = "Focused"
            confidence = 0.6 + beta_ratio * 0.4
        
        # Very high beta + gamma = Stressed
        elif beta_ratio > 0.4 and gamma_ratio > 0.2:
            state = "Stressed"
            confidence = 0.6 + (beta_ratio + gamma_ratio) * 0.3
        
        # Default: Neutral
        else:
            state = "Neutral"
            confidence = 0.7
        
        # Smooth state transitions
        self.mental_state_history.append((state, confidence))
        
        # Get most common recent state
        if len(self.mental_state_history) >= 3:
            states = [s[0] for s in self.mental_state_history]
            from collections import Counter
            state = Counter(states).most_common(1)[0][0]
            # Average confidence for that state
            confs = [s[1] for s in self.mental_state_history if s[0] == state]
            confidence = sum(confs) / len(confs)
        
        return state, min(0.95, confidence)
    
    def calculate_stress_level(self) -> float:
        """
        Calculate stress level (0-100) based on brainwave patterns.
        High beta/gamma and low alpha indicate stress.
        """
        bands = self.get_band_powers()
        
        alpha = bands.get("alpha", 0)
        beta = bands.get("beta", 0)
        gamma = bands.get("gamma", 0)
        
        # Stress formula: high beta+gamma, low alpha = high stress
        total = alpha + beta + gamma + 1e-10
        stress = ((beta + gamma * 1.5) / total * 100) - (alpha / total * 30)
        stress = max(0, min(100, stress))
        
        # Smooth stress level
        self.stress_history.append(stress)
        smoothed_stress = sum(self.stress_history) / len(self.stress_history)
        
        return round(smoothed_stress, 1)
    
    def get_signal_quality(self) -> float:
        """
        Estimate signal quality (0-100).
        Based on signal variance and noise detection.
        """
        if len(self.filtered_buffer) < 50:
            return 0
        
        data = np.array(list(self.filtered_buffer)[-256:])
        
        # Check for flat signal (no contact)
        variance = np.var(data)
        if variance < 1:
            return 10  # Poor quality - no signal
        
        # Check for excessive noise
        if variance > 10000:
            return 30  # Poor quality - too much noise
        
        # Check for 50/60 Hz power line interference
        spectrum = self.get_frequency_spectrum()
        power_line_noise = max(
            spectrum[50]["magnitude"] if len(spectrum) > 50 else 0,
            spectrum[60]["magnitude"] if len(spectrum) > 60 else 0
        )
        
        # Calculate quality score
        quality = 85
        
        # Penalize for noise
        if power_line_noise > 20:
            quality -= 20
        
        # Reward for good variance
        if 100 < variance < 5000:
            quality += 10
        
        return max(0, min(100, quality))
    
    def get_recent_signal(self, n_samples: int = 256) -> List[float]:
        """Get the most recent filtered signal samples."""
        return list(self.filtered_buffer)[-n_samples:]
    
    def reset(self):
        """Reset the processor state."""
        self.buffer.clear()
        self.filtered_buffer.clear()
        self.mental_state_history.clear()
        self.stress_history.clear()
        self.zi = signal.lfilter_zi(self.b, self.a)
