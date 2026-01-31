from app.agents.base import BaseAgent
from typing import Dict, Any
import logging
import os
import asyncio

logger = logging.getLogger("TRANSCRIPTION_AGENT")

# Global whisper model cache
_whisper_model = None

def _get_whisper_model():
    """Lazy-load and cache the Whisper model to avoid reloading"""
    global _whisper_model
    if _whisper_model is None:
        try:
            import whisper
            logger.info("🔄 [TRANSCRIPTION] Loading Whisper model (medium)...")
            _whisper_model = whisper.load_model("medium")
            logger.info("✅ [TRANSCRIPTION] Whisper model loaded successfully")
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
        # Try to pre-load model in background
        try:
            import threading
            threading.Thread(target=_get_whisper_model, daemon=True).start()
        except:
            pass

    async def run(self, audio_path: str) -> Dict[str, Any]:
        """
        Transcribe audio file using OpenAI Whisper.
        Falls back to intelligent sample if Whisper unavailable.
        """
        logger.info("=" * 60)
        logger.info(f"🎤 [TRANSCRIPTION] Starting transcription")
        logger.info(f"📁 [TRANSCRIPTION] File: {audio_path}")
        logger.info("=" * 60)
        
        # Check if file exists
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
        logger.info(f"📏 [TRANSCRIPTION] File size: {file_size} bytes ({file_size/1024:.1f} KB)")
        
        # Try Whisper transcription - NO FALLBACK, REAL TRANSCRIPTION ONLY
        model = _get_whisper_model()
        
        if model is None:
            error_msg = "❌ Whisper model not loaded! Install with: pip install openai-whisper"
            logger.error(f"❌ [TRANSCRIPTION] {error_msg}")
            raise RuntimeError(error_msg)
        
        try:
            logger.info("🔄 [TRANSCRIPTION] Running Whisper transcription...")
            
            # Run transcription in thread pool to not block async
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                lambda: model.transcribe(audio_path, language="en", fp16=False)
            )
            
            # Extract text from segments (same as reference script)
            segments = result.get("segments", [])
            
            if not segments:
                error_msg = "Transcription produced no segments"
                logger.error(f"❌ [TRANSCRIPTION] {error_msg}")
                raise RuntimeError(error_msg)
            
            logger.info(f"📊 [TRANSCRIPTION] Found {len(segments)} segments")
            
            # Build full text from segments with timestamps logged
            text_parts = []
            for seg in segments:
                start = seg.get('start', 0)
                end = seg.get('end', 0)
                text = seg.get('text', '').strip()
                if text:
                    text_parts.append(text)
                    logger.info(f"[{start:.2f}s → {end:.2f}s] {text}")
            
            full_text = " ".join(text_parts)
            
            if not full_text:
                error_msg = "Transcription produced empty text"
                logger.error(f"❌ [TRANSCRIPTION] {error_msg}")
                raise RuntimeError(error_msg)
            
            duration = result.get("duration", 0)
            language = result.get("language", "en")
            
            logger.info(f"✅ [TRANSCRIPTION] Whisper complete!")
            logger.info(f"📝 [TRANSCRIPTION] Transcript length: {len(full_text)} chars")
            logger.info(f"⏱️ [TRANSCRIPTION] Audio duration: {duration:.1f}s")
            logger.info(f"🌐 [TRANSCRIPTION] Detected language: {language}")
            logger.info("=" * 60)
            
            return {
                "text": full_text,
                "language": language,
                "duration": duration,
                "confidence": 0.95,
                "source": "whisper",
                "segments": segments
            }
            
        except Exception as e:
            error_msg = f"Whisper transcription failed: {str(e)}"
            logger.error(f"❌ [TRANSCRIPTION] {error_msg}")
            raise RuntimeError(error_msg)
