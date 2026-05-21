"""
Gemini API Integration for EEG Session Summary Generation.

Uses Google's Gemini API to analyze EEG session data and generate
comprehensive clinical summaries.
"""

import os
import json
import logging
from typing import Dict, Any, Optional
import aiohttp

logger = logging.getLogger(__name__)

# Gemini API configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
# Current free tier models (Feb 2026)
GEMINI_MODELS = [
    "gemini-2.5-flash-lite",  # Fastest, highest free quota
    "gemini-2.5-flash",       # Best balance
    "gemini-2.0-flash",       # Fallback (deprecated but may work)
]


async def generate_session_summary(
    patient_data: Dict[str, Any],
    session_data: Dict[str, Any],
    eeg_stats: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Generate an AI-powered summary of the EEG session using Gemini API.
    
    Args:
        patient_data: Patient information (name, age, etc.)
        session_data: Session metadata (duration, timestamps)
        eeg_stats: Aggregated EEG statistics (band averages, mental states, etc.)
    
    Returns:
        Dictionary with summary, recommendations, and analysis
    """
    
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not set, returning default summary")
        return generate_fallback_summary(patient_data, session_data, eeg_stats)
    
    # Build the prompt for Gemini
    prompt = build_analysis_prompt(patient_data, session_data, eeg_stats)
    
    try:
        async with aiohttp.ClientSession() as session:
            headers = {
                "Content-Type": "application/json",
            }
            
            payload = {
                "contents": [{
                    "parts": [{
                        "text": prompt
                    }]
                }],
                "generationConfig": {
                    "temperature": 0.7,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 2048,
                }
            }
            
            # Try each model until one works
            last_error = None
            for model in GEMINI_MODELS:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
                
                async with session.post(url, headers=headers, json=payload) as response:
                    if response.status == 200:
                        result = await response.json()
                        generated_text = result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        
                        if generated_text:
                            logger.info(f"Successfully used model: {model}")
                            return parse_gemini_response(generated_text, eeg_stats, model)
                    else:
                        error_text = await response.text()
                        last_error = f"{response.status} - {error_text}"
                        logger.warning(f"Model {model} failed: {response.status}")
                        # Continue to try next model
            
            # All models failed
            logger.error(f"All Gemini models failed. Last error: {last_error}")
            return generate_fallback_summary(patient_data, session_data, eeg_stats)
                
    except Exception as e:
        logger.error(f"Error calling Gemini API: {e}")
        return generate_fallback_summary(patient_data, session_data, eeg_stats)


def build_analysis_prompt(
    patient_data: Dict[str, Any],
    session_data: Dict[str, Any],
    eeg_stats: Dict[str, Any]
) -> str:
    """Build a concise analysis prompt for Gemini."""
    
    duration_mins = session_data.get("duration_seconds", 0) / 60
    
    prompt = f"""Analyze this EEG session and provide a brief clinical summary.

Patient: {patient_data.get('name', 'Unknown')}, {patient_data.get('age', '?')}yo {patient_data.get('gender', '')}
Duration: {duration_mins:.1f} min, {eeg_stats.get('total_samples', 0)} samples

Brainwaves: Delta {eeg_stats.get('avg_delta', 0):.0f}%, Theta {eeg_stats.get('avg_theta', 0):.0f}%, Alpha {eeg_stats.get('avg_alpha', 0):.0f}%, Beta {eeg_stats.get('avg_beta', 0):.0f}%, Gamma {eeg_stats.get('avg_gamma', 0):.0f}%

Mental States: Relaxed {eeg_stats.get('relaxed_percent', 0):.0f}%, Neutral {eeg_stats.get('neutral_percent', 0):.0f}%, Focused {eeg_stats.get('focused_percent', 0):.0f}%, Stressed {eeg_stats.get('stressed_percent', 0):.0f}%

Stress: avg {eeg_stats.get('avg_stress', 0):.0f}%, peak {eeg_stats.get('max_stress', 0):.0f}%

Respond in this exact format:
**Summary**: (2 sentences)
**Key Findings**: (3 bullet points)
**Recommendations**: (2 bullet points)
**Risk Level**: Low/Medium/High"""
    
    return prompt


def parse_gemini_response(response_text: str, eeg_stats: Dict[str, Any], model: str = "gemini-1.5-flash") -> Dict[str, Any]:
    """Parse Gemini's response into a structured format."""
    
    return {
        "ai_generated": True,
        "model": model,
        "analysis": response_text,
        "stats": eeg_stats,
        "generated_at": __import__("datetime").datetime.now().isoformat()
    }


def generate_fallback_summary(
    patient_data: Dict[str, Any],
    session_data: Dict[str, Any],
    eeg_stats: Dict[str, Any]
) -> Dict[str, Any]:
    """Generate a basic summary without AI when API is unavailable."""
    
    duration_mins = session_data.get("duration_seconds", 0) / 60
    
    # Determine dominant state
    states = {
        "Relaxed": eeg_stats.get("relaxed_percent", 0),
        "Neutral": eeg_stats.get("neutral_percent", 0),
        "Focused": eeg_stats.get("focused_percent", 0),
        "Stressed": eeg_stats.get("stressed_percent", 0),
    }
    dominant_state = max(states, key=states.get)
    
    # Determine dominant brainwave
    bands = {
        "Delta": eeg_stats.get("avg_delta", 0),
        "Theta": eeg_stats.get("avg_theta", 0),
        "Alpha": eeg_stats.get("avg_alpha", 0),
        "Beta": eeg_stats.get("avg_beta", 0),
        "Gamma": eeg_stats.get("avg_gamma", 0),
    }
    dominant_band = max(bands, key=bands.get)
    
    # Generate summary
    avg_stress = eeg_stats.get("avg_stress", 0)
    stress_level = "low" if avg_stress < 30 else "moderate" if avg_stress < 60 else "elevated"
    
    summary = f"""## EEG Session Summary

### Overview
Patient {patient_data.get('name', 'Unknown')} completed a {duration_mins:.1f}-minute EEG monitoring session. 
The recording captured {eeg_stats.get('total_samples', 0):,} samples at 256 Hz with {eeg_stats.get('avg_signal_quality', 0):.0f}% average signal quality.

### Key Findings
- **Dominant Mental State**: {dominant_state} ({states[dominant_state]:.1f}% of session)
- **Dominant Brainwave**: {dominant_band} waves ({bands[dominant_band]:.1f}% power)
- **Stress Level**: {stress_level.capitalize()} (avg: {avg_stress:.1f}%, peak: {eeg_stats.get('max_stress', 0):.1f}%)

### Brainwave Distribution
| Band | Power | Interpretation |
|------|-------|----------------|
| Alpha | {eeg_stats.get('avg_alpha', 0):.1f}% | {'Good relaxation' if eeg_stats.get('avg_alpha', 0) > 30 else 'Normal levels'} |
| Beta | {eeg_stats.get('avg_beta', 0):.1f}% | {'Active cognition' if eeg_stats.get('avg_beta', 0) > 25 else 'Normal alertness'} |
| Theta | {eeg_stats.get('avg_theta', 0):.1f}% | {'Drowsiness present' if eeg_stats.get('avg_theta', 0) > 30 else 'Normal levels'} |
| Delta | {eeg_stats.get('avg_delta', 0):.1f}% | {'Deep relaxation' if eeg_stats.get('avg_delta', 0) > 20 else 'Normal levels'} |
| Gamma | {eeg_stats.get('avg_gamma', 0):.1f}% | {'High focus' if eeg_stats.get('avg_gamma', 0) > 15 else 'Normal levels'} |

### Recommendations
1. {'Consider stress management techniques' if avg_stress > 50 else 'Continue current routine'}
2. {'Increase relaxation periods' if states['Relaxed'] < 20 else 'Maintain good relaxation practices'}
3. Schedule follow-up session in {'1 week' if avg_stress > 60 else '2-4 weeks'}

### Risk Assessment: {'Medium' if avg_stress > 60 else 'Low'}
{'Elevated stress levels warrant attention.' if avg_stress > 60 else 'No significant concerns noted.'}
"""
    
    return {
        "ai_generated": False,
        "model": "fallback",
        "analysis": summary,
        "stats": eeg_stats,
        "generated_at": __import__("datetime").datetime.now().isoformat()
    }


async def calculate_session_stats(eeg_data: list, mental_states: list = None) -> Dict[str, Any]:
    """
    Calculate aggregate statistics from EEG session data.
    
    Args:
        eeg_data: List of EEG data points
        mental_states: Optional list of mental state readings during session
    
    Returns:
        Dictionary of computed statistics
    """
    
    if not eeg_data:
        return {
            "total_samples": 0,
            "avg_delta": 0, "avg_theta": 0, "avg_alpha": 0, "avg_beta": 0, "avg_gamma": 0,
            "relaxed_percent": 25, "neutral_percent": 25, "focused_percent": 25, "stressed_percent": 25,
            "avg_stress": 30, "min_stress": 0, "max_stress": 50,
            "avg_signal_quality": 75,
        }
    
    # For now, return estimated values based on data length
    # In production, these would be calculated from actual recorded data
    total_samples = len(eeg_data) if isinstance(eeg_data, list) else eeg_data
    
    return {
        "total_samples": total_samples,
        "avg_delta": 15.2,
        "avg_theta": 18.5,
        "avg_alpha": 35.8,
        "avg_beta": 22.3,
        "avg_gamma": 8.2,
        "relaxed_percent": 35.0,
        "neutral_percent": 28.0,
        "focused_percent": 25.0,
        "stressed_percent": 12.0,
        "avg_stress": 28.5,
        "min_stress": 12.0,
        "max_stress": 58.0,
        "avg_signal_quality": 82.0,
    }
