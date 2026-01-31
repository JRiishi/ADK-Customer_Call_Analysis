from app.agents.orchestrator import orchestrator
from app.agents.specialized.transcription import TranscriptionAgent
from app.core.database import get_database
import logging
import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("ANALYSIS_SERVICE")

class AnalysisService:
    def __init__(self):
        self.transcription_agent = TranscriptionAgent()
        logger.info("✅ Analysis Service initialized")

    async def analyze_call(self, call_id: str, input_data: str, is_audio_path: bool = False):
        """
        Full Call Analysis Pipeline with comprehensive logging.
        Args:
            call_id: Unique ID
            input_data: Either a transcript text OR an audio file path
            is_audio_path: Flag to indicate if input_data is a file path
        """
        logger.info("=" * 70)
        logger.info(f"🚀 ANALYSIS SERVICE - STARTING PIPELINE")
        logger.info(f"📞 Call ID: {call_id}")
        logger.info(f"📄 Input Type: {'Audio File' if is_audio_path else 'Text Transcript'}")
        logger.info(f"📏 Input Length: {len(input_data)} chars")
        logger.info("=" * 70)
        
        try:
            # 1. Transcription (if needed)
            if is_audio_path:
                logger.info(f"🎤 Step 1: Transcribing audio file...")
                logger.info(f"📁 File path: {input_data}")
                transcription_result = await self.transcription_agent.run(input_data)
                transcript = transcription_result.get("text", "")
                logger.info(f"✅ Transcription complete: {len(transcript)} chars")
            else:
                logger.info(f"📝 Step 1: Using provided transcript directly")
                transcript = input_data
            
            logger.info(f"📝 Transcript preview: {transcript[:200]}...")
            
            # 2. Run Agent Pipeline
            logger.info("-" * 50)
            logger.info("🤖 Step 2: Running Agent Pipeline...")
            analysis_result = await orchestrator.analyze_call(call_id, transcript)
            logger.info("✅ Agent pipeline complete")
            
            # 3. Extract Summary Scores for DB Indexing
            logger.info("-" * 50)
            logger.info("📊 Step 3: Extracting scores for database...")
            
            summary_metrics = analysis_result.get("summary_metrics", {})
            scores = {
                "qa": summary_metrics.get("qa_score", 0),
                "sop": summary_metrics.get("sop_score", 0),
                "sentiment": summary_metrics.get("sentiment_score", 0),
                "risk": 100 if summary_metrics.get("risk_detected") else 0
            }
            
            logger.info(f"📊 Scores: QA={scores['qa']}, SOP={scores['sop']}, Sentiment={scores['sentiment']}")

            # 4. Save to MongoDB
            logger.info("-" * 50)
            logger.info("💾 Step 4: Persisting to database...")
            
            db = await get_database()
            if db is not None:
                await db["calls"].update_one(
                    {"_id": call_id},
                    {
                        "$set": {
                            "analysis": analysis_result,
                            "scores": scores,
                            "status": "completed",
                            "ended_at": datetime.datetime.utcnow(),
                            "transcript": transcript,
                            # Granular fields for quick access
                            "sentiment_analysis": analysis_result.get("sentiment"),
                            "sop_analysis": analysis_result.get("sop_compliance"),
                            "risk_analysis": analysis_result.get("risk_analysis"),
                            "qa_analysis": analysis_result.get("qa_score"),
                            "coaching_analysis": analysis_result.get("coaching")
                        }
                    },
                    upsert=True  # Create if not exists
                )
                logger.info(f"✅ Database updated successfully for {call_id}")
            else:
                logger.error("❌ Database unavailable! Data not persisted.")
            
            logger.info("=" * 70)
            logger.info(f"🎉 ANALYSIS COMPLETE: {call_id}")
            logger.info("=" * 70)
            
            return analysis_result
            
        except Exception as e:
            logger.error("=" * 70)
            logger.error(f"❌ ANALYSIS FAILED for {call_id}")
            logger.error(f"❌ Error: {e}")
            import traceback
            logger.error(f"❌ Traceback:\n{traceback.format_exc()}")
            logger.error("=" * 70)
            
            # Update DB with failure
            try:
                db = await get_database()
                if db:
                    await db["calls"].update_one(
                        {"_id": call_id},
                        {"$set": {"status": "failed", "error": str(e)}},
                        upsert=True
                    )
                    logger.info(f"📝 Failure status recorded in database")
            except Exception as db_error:
                logger.error(f"❌ Could not update database with error: {db_error}")
            
            raise e

analysis_service = AnalysisService()
