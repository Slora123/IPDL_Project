#!/usr/bin/env python3
"""
Whisper Speech-to-Text Transcription Script
Transcribes audio files using OpenAI's Whisper model
"""

import sys
import os
import whisper
import warnings

# Suppress warnings
warnings.filterwarnings("ignore")

def transcribe_audio(audio_file_path, language=None):
    """
    Transcribe audio file using Whisper
    
    Args:
        audio_file_path: Path to audio file
        language: Optional language code (e.g., 'hi', 'mr', 'en')
    
    Returns:
        Transcribed text
    """
    try:
        # Load Whisper model (downloads on first use)
        # Using 'small' model for better multilingual accuracy (~480MB)
        # Note: 'base' model (140MB) is too weak for accurate Hindi/Marathi transcription
        # Other options: 'tiny' (39MB), 'medium' (1.5GB), 'large' (3GB)
        model = whisper.load_model("small")
        
        # Transcribe audio
        if language:
            result = model.transcribe(audio_file_path, language=language)
        else:
            # Auto-detect language
            result = model.transcribe(audio_file_path)
        
        # Return transcript
        return result["text"].strip()
    
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        return None

def main():
    if len(sys.argv) < 2:
        print("Usage: python speech.py <audio_file> [language]", file=sys.stderr)
        sys.exit(1)
    
    audio_file = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else None
    
    if not os.path.exists(audio_file):
        print(f"ERROR: Audio file not found: {audio_file}", file=sys.stderr)
        sys.exit(1)
    
    # Transcribe
    transcript = transcribe_audio(audio_file, language)
    
    if transcript:
        # Output transcript to stdout (will be captured by Node.js)
        print(transcript)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
