from app.agents.base import BaseAgent
from typing import Dict, Any
import logging
import os
import asyncio
import boto3
import uuid
import json

logger = logging.getLogger("TRANSCRIPTION_AGENT")

# AWS Transcribe client (lazy loaded)
_transcribe_client = None
_s3_client = None

def _get_aws_clients():
    """Get or create AWS clients for Transcribe and S3"""
    global _transcribe_client, _s3_client
    
    if _transcribe_client is None:
        try:
            # Use default credentials (IAM role on EC2/ECS, or ~/.aws/credentials locally)
            region = os.getenv("AWS_REGION", "us-east-1")
            
            _transcribe_client = boto3.client('transcribe', region_name=region)
            _s3_client = boto3.client('s3', region_name=region)
            
            logger.info(f"✅ [TRANSCRIPTION] AWS Transcribe client initialized (region: {region})")
        except Exception as e:
            logger.error(f"❌ [TRANSCRIPTION] Failed to initialize AWS clients: {e}")
            raise
    
    return _transcribe_client, _s3_client


class TranscriptionAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="TranscriptionAgent",
            role="You are an expert audio transcription system using AWS Transcribe."
        )
        
        # S3 bucket for audio files (required for AWS Transcribe)
        self.s3_bucket = os.getenv("TRANSCRIBE_S3_BUCKET", "cognivista-audio-uploads")
        self.s3_prefix = os.getenv("TRANSCRIBE_S3_PREFIX", "audio-uploads/")
        
        logger.info("🎤 Transcription Agent initialized (AWS Transcribe)")
        logger.info(f"   📦 S3 Bucket: {self.s3_bucket}")

    async def run(self, audio_path: str) -> Dict[str, Any]:
        logger.info("=" * 60)
        logger.info(f"🎤 [TRANSCRIPTION] Starting AWS Transcribe")
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

        try:
            transcribe_client, s3_client = _get_aws_clients()
            
            # Generate unique job name
            job_name = f"cognivista-{uuid.uuid4().hex[:12]}"
            file_ext = os.path.splitext(audio_path)[1].lower().replace(".", "")
            s3_key = f"{self.s3_prefix}{job_name}.{file_ext}"
            
            # Upload audio file to S3
            logger.info(f"📤 [TRANSCRIPTION] Uploading to S3: s3://{self.s3_bucket}/{s3_key}")
            
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: s3_client.upload_file(audio_path, self.s3_bucket, s3_key)
            )
            
            s3_uri = f"s3://{self.s3_bucket}/{s3_key}"
            logger.info(f"✅ [TRANSCRIPTION] Uploaded to {s3_uri}")
            
            # Determine media format
            media_format = self._get_media_format(file_ext)
            
            # Start transcription job
            logger.info(f"🚀 [TRANSCRIPTION] Starting job: {job_name}")
            
            await loop.run_in_executor(
                None,
                lambda: transcribe_client.start_transcription_job(
                    TranscriptionJobName=job_name,
                    Media={'MediaFileUri': s3_uri},
                    MediaFormat=media_format,
                    Settings={
                        'ShowSpeakerLabels': True,
                        'MaxSpeakerLabels': 2,  # Agent + Customer
                        'ShowAlternatives': False,
                    },
                    # Auto-detect language (Hindi, English, etc.)
                    IdentifyMultipleLanguages=True,
                    LanguageOptions=['hi-IN', 'en-US', 'en-IN'],
                )
            )
            
            # Poll for completion
            logger.info("⏳ [TRANSCRIPTION] Waiting for job completion...")
            result = await self._wait_for_job(transcribe_client, job_name, loop)
            
            # Clean up S3 file
            try:
                await loop.run_in_executor(
                    None,
                    lambda: s3_client.delete_object(Bucket=self.s3_bucket, Key=s3_key)
                )
                logger.info(f"🗑️ [TRANSCRIPTION] Cleaned up S3 file")
            except Exception as cleanup_err:
                logger.warning(f"⚠️ [TRANSCRIPTION] Failed to clean up S3: {cleanup_err}")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ [TRANSCRIPTION] AWS Transcribe failed: {e}")
            raise

    def _get_media_format(self, ext: str) -> str:
        """Map file extension to AWS Transcribe media format"""
        format_map = {
            'mp3': 'mp3',
            'mp4': 'mp4',
            'wav': 'wav',
            'flac': 'flac',
            'ogg': 'ogg',
            'amr': 'amr',
            'webm': 'webm',
            'm4a': 'mp4',
        }
        return format_map.get(ext, 'mp3')

    async def _wait_for_job(self, client, job_name: str, loop) -> Dict[str, Any]:
        """Poll AWS Transcribe until job completes"""
        max_attempts = 120  # 10 minutes max (5s intervals)
        attempt = 0
        
        while attempt < max_attempts:
            response = await loop.run_in_executor(
                None,
                lambda: client.get_transcription_job(TranscriptionJobName=job_name)
            )
            
            status = response['TranscriptionJob']['TranscriptionJobStatus']
            
            if status == 'COMPLETED':
                logger.info(f"✅ [TRANSCRIPTION] Job completed!")
                return await self._parse_result(response, loop)
            
            elif status == 'FAILED':
                reason = response['TranscriptionJob'].get('FailureReason', 'Unknown')
                logger.error(f"❌ [TRANSCRIPTION] Job failed: {reason}")
                raise RuntimeError(f"Transcription failed: {reason}")
            
            # Still in progress
            if attempt % 6 == 0:  # Log every 30 seconds
                logger.info(f"⏳ [TRANSCRIPTION] Status: {status} (attempt {attempt + 1})")
            
            await asyncio.sleep(5)
            attempt += 1
        
        raise RuntimeError("Transcription timed out after 10 minutes")

    async def _parse_result(self, response: dict, loop) -> Dict[str, Any]:
        """Parse AWS Transcribe result"""
        import urllib.request
        
        job = response['TranscriptionJob']
        transcript_uri = job['Transcript']['TranscriptFileUri']
        
        # Download transcript JSON
        logger.info(f"📥 [TRANSCRIPTION] Downloading transcript...")
        
        transcript_data = await loop.run_in_executor(
            None,
            lambda: json.loads(urllib.request.urlopen(transcript_uri).read().decode('utf-8'))
        )
        
        # Extract full transcript text
        results = transcript_data.get('results', {})
        transcripts = results.get('transcripts', [])
        
        if not transcripts:
            raise RuntimeError("No transcript found in result")
        
        full_text = transcripts[0].get('transcript', '')
        
        if not full_text:
            raise RuntimeError("Empty transcription")
        
        # Get detected language
        language_codes = job.get('LanguageCodes', [])
        detected_language = language_codes[0]['LanguageCode'] if language_codes else 'hi-IN'
        
        # Parse segments/items for duration estimate
        items = results.get('items', [])
        duration = 0
        if items:
            last_item = items[-1]
            duration = float(last_item.get('end_time', 0))
        
        # Calculate average confidence
        confidences = [
            float(item.get('alternatives', [{}])[0].get('confidence', 0))
            for item in items
            if item.get('type') == 'pronunciation' and item.get('alternatives')
        ]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.85
        
        logger.info(f"🌐 [TRANSCRIPTION] Detected language: {detected_language}")
        logger.info(f"📊 [TRANSCRIPTION] {len(items)} items, {duration:.1f}s duration")
        logger.info(f"✅ [TRANSCRIPTION] Complete! {len(full_text)} chars")
        logger.info("=" * 60)
        
        return {
            "text": full_text,
            "language": detected_language,
            "duration": duration,
            "confidence": round(avg_confidence, 2),
            "source": "aws-transcribe",
            "items": items[:50]  # First 50 items for reference
        }
