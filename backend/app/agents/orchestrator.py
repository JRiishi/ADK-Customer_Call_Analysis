import asyncio
import logging
from typing import Dict, Any

from app.agents.specialized.sentiment import SentimentAgent
from app.agents.specialized.sop import SOPComplianceAgent
from app.agents.specialized.risk import RiskDetectionAgent
from app.agents.specialized.qa import QAScoringAgent
from app.agents.specialized.coaching import CoachingAgent

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("ORCHESTRATOR")

class OrchestratorAgent:
    def __init__(self):
        logger.info("=" * 70)
        logger.info("🎼 ORCHESTRATOR AGENT - INITIALIZING")
        logger.info("=" * 70)
        
        self.sentiment_agent = SentimentAgent()
        self.sop_agent = SOPComplianceAgent()
        self.risk_agent = RiskDetectionAgent()
        self.qa_agent = QAScoringAgent()
        self.coaching_agent = CoachingAgent()
        
        logger.info("✅ All specialized agents loaded")
        logger.info("=" * 70)

    async def analyze_call(self, call_id: str, transcript: str) -> Dict[str, Any]:
        """
        Executes the full agent pipeline on a call transcript.
        Comprehensive logging for debugging.
        """
        logger.info("=" * 70)
        logger.info(f"🎬 STARTING ANALYSIS PIPELINE")
        logger.info(f"📞 Call ID: {call_id}")
        logger.info(f"📝 Transcript length: {len(transcript)} chars")
        logger.info(f"📝 Transcript preview: {transcript[:200]}...")
        logger.info("=" * 70)
        
        # Define tasks for parallel execution
        logger.info("🚀 Launching all agents in parallel...")
        
        tasks = {
            "sentiment": self.sentiment_agent.run(transcript),
            "sop_compliance": self.sop_agent.run(transcript),
            "risk_analysis": self.risk_agent.run(transcript),
            "qa_score": self.qa_agent.run(transcript),
            "coaching": self.coaching_agent.run(transcript)
        }
        
        # Run all agents concurrently
        logger.info(f"⏳ Awaiting {len(tasks)} agent results...")
        results = await asyncio.gather(*tasks.values(), return_exceptions=True)
        
        # Map results back to keys
        clean_results = {}
        for key, result in zip(tasks.keys(), results):
            if isinstance(result, Exception):
                logger.error(f"❌ Agent [{key}] FAILED: {result}")
                clean_results[key] = {"error": str(result)}
            else:
                logger.info(f"✅ Agent [{key}] completed successfully")
                logger.debug(f"📊 [{key}] Result: {result}")
                clean_results[key] = result

        # Log individual agent results
        logger.info("-" * 50)
        logger.info("📊 AGENT RESULTS SUMMARY:")
        for key, result in clean_results.items():
            if "error" in result:
                logger.warning(f"   ⚠️ {key}: ERROR - {result.get('error', 'Unknown')}")
            else:
                logger.info(f"   ✅ {key}: OK")
        logger.info("-" * 50)

        # Extract metrics with safe defaults
        sentiment_data = clean_results.get("sentiment", {})
        sop_data = clean_results.get("sop_compliance", {})
        qa_data = clean_results.get("qa_score", {})
        risk_data = clean_results.get("risk_analysis", {})
        
        sentiment_score = sentiment_data.get("score", 0)
        sop_score = sop_data.get("adherence_score", 0)
        qa_score = qa_data.get("total_score", 0)
        risk_detected = risk_data.get("risk_detected", False)
        risk_severity = risk_data.get("severity", "none")
        
        logger.info("📈 COMPUTED METRICS:")
        logger.info(f"   🎭 Sentiment Score: {sentiment_score}")
        logger.info(f"   📋 SOP Score: {sop_score}")
        logger.info(f"   📊 QA Score: {qa_score}")
        logger.info(f"   ⚠️ Risk Detected: {risk_detected} ({risk_severity})")
        
        # Build final analysis object
        final_analysis = {
            "call_id": call_id,
            "transcript_text": transcript,
            "sentiment": clean_results.get("sentiment"),
            "sop_compliance": clean_results.get("sop_compliance"),
            "risk_analysis": clean_results.get("risk_analysis"),
            "qa_score": clean_results.get("qa_score"),
            "coaching": clean_results.get("coaching"),
            "summary_metrics": {
                "sentiment_score": sentiment_score,
                "sop_score": sop_score,
                "qa_score": qa_score,
                "risk_detected": risk_detected,
                "risk_severity": risk_severity
            },
            # Add summary for frontend compatibility
            "summary": {
                "sentiment_score": sentiment_score,
                "sop_score": sop_score,
                "qa_score": qa_score,
                "risk_severity": risk_severity if risk_detected else "none"
            }
        }
        
        logger.info("=" * 70)
        logger.info(f"✅ ANALYSIS COMPLETE FOR {call_id}")
        logger.info("=" * 70)
        
        return final_analysis

orchestrator = OrchestratorAgent()
