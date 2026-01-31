from app.agents.base import BaseAgent
from typing import Dict, Any
import logging
import os
import asyncio

logger = logging.getLogger("TRANSCRIPTION_AGENT")

# Global whisper model cache
_whisper_model = None

def _get_whisper_model():
    """Lazy-load and cache the Whisper MEDIUM model optimized for Hindi/Indian on Apple Silicon"""
    global _whisper_model
    if _whisper_model is None:
        try:
            import ssl
            ssl._create_default_https_context = ssl._create_unverified_context
            
            import whisper
            import torch
            
            # MEDIUM model - best balance of speed and accuracy
            model_name = "medium"
            
            if torch.backends.mps.is_available():
                device = "mps"
                logger.info(f"🔄 [TRANSCRIPTION] Loading Whisper {model_name} on Apple Silicon GPU (MPS)...")
            else:
                device = "cpu"
                logger.info(f"🔄 [TRANSCRIPTION] Loading Whisper {model_name} on CPU...")
            
            _whisper_model = whisper.load_model(model_name, device=device)
            logger.info(f"✅ [TRANSCRIPTION] Whisper {model_name} loaded successfully on {device}")
        except ImportError:
            logger.error("❌ [TRANSCRIPTION] Whisper not installed! Run: pip install openai-whisper")
            _whisper_model = None
        except Exception as e:
            logger.error(f"❌ [TRANSCRIPTION] Failed to load Whisper model: {e}")
            _whisper_model = None
    return _whisper_model


class TranscriptionAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="TranscriptionAgent",
            role="You are an expert audio transcription system."
        )
        logger.info("🎤 Transcription Agent initialized")
        try:
            import threading
            threading.Thread(target=_get_whisper_model, daemon=True).start()
        except:
            pass

    async def run(self, audio_path: str) -> Dict[str, Any]:
        logger.info("=" * 60)
        logger.info(f"🎤 [TRANSCRIPTION] Starting transcription")
        logger.info(f"📁 [TRANSCRIPTION] File: {audio_path}")
        logger.info("=" * 60)
        
        if not os.path.exists(audio_path):
            logger.error(f"❌ [TRANSCRIPTION] File not found: {audio_path}")
            return {
                "text": "",
                "language": "en-US",
                "duration": 0,
                "confidence": 0,
                "source": "error",
                "error": "File not found"
            }
        
        file_size = os.path.getsize(audio_path)
        logger.info(f"📏 [TRANSCRIPTION] File size: {file_size / 1024:.1f} KB")
        
        model = _get_whisper_model()
        if model is None:
            raise RuntimeError("Whisper model not loaded")

        try:
            logger.info("🔄 [TRANSCRIPTION] Running Whisper MEDIUM (Hindi/Indian optimized)...")
            loop = asyncio.get_event_loop()

            result = await loop.run_in_executor(
                None,
                lambda: model.transcribe(
                    audio_path,
                    
                    # TRANSCRIBE (not translate) - keep original language
                    task="transcribe",
                    
                    # FORCE HINDI - better than auto-detect for Indian audio
                    language="hi",
                    
                    # Strong Hindi context prompt
                    initial_prompt=(
                        "यह एक कस्टमर सर्विस कॉल है। "
                        "Hello, welcome. Driver ID. Battery Smart. OTP. "
                        "Please tell me. Thank you. Sorry. Okay. Yes. No. "
                        "Ji haan. Theek hai. Acha. Dhanyavaad. Namaskar."
                    ),
                    
                    # OPTIMIZED SETTINGS FOR MEDIUM MODEL
                    fp16=False,                         # MPS-safe
                    
                    # Temperature with fallback for noisy audio
                    temperature=(0.0, 0.2, 0.4),
                    
                    # Beam search for accuracy
                    beam_size=5,
                    patience=1.0,
                    
                    # HALLUCINATION PREVENTION
                    condition_on_previous_text=False,   # Prevents loops
                    compression_ratio_threshold=2.4,    # Default - balanced
                    no_speech_threshold=0.6,            # Good silence detection
                    logprob_threshold=-1.0,             # Accept predictions
                    
                    word_timestamps=False,
                    verbose=False
                )
            )

            segments = result.get("segments", [])
            detected_language = result.get("language", "hi")
            duration = result.get("duration", 0)
            
            logger.info(f"🌐 [TRANSCRIPTION] Detected language: {detected_language}")
            logger.info(f"📊 [TRANSCRIPTION] Found {len(segments)} segments")
            
            if not segments:
                raise RuntimeError("Transcription produced no segments")

            # Build full text from segments
            text_parts = []
            for seg in segments:
                text = seg.get("text", "").strip()
                if text:
                    text_parts.append(text)
                    if len(text_parts) <= 3:
                        start = seg.get("start", 0)
                        end = seg.get("end", 0)
                        logger.info(f"   [{start:.1f}s-{end:.1f}s] {text[:100]}")

            full_text = " ".join(text_parts)
            
            if not full_text:
                raise RuntimeError("Empty transcription")

            logger.info(f"✅ [TRANSCRIPTION] Complete! {len(full_text)} chars, {duration:.1f}s audio")
            logger.info("=" * 60)

            return {
                "text": full_text,
                "language": detected_language,
                "duration": duration,
                "confidence": 0.90,
                "source": "whisper-medium",
                "segments": segments
            }

        except Exception as e:
            logger.error(f"❌ [TRANSCRIPTION] Whisper transcription failed: {e}")
            raise
