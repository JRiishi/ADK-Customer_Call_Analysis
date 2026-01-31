from app.core.bus import global_bus
from app.agents.loader import agent_loader
import asyncio

class WorkerAgent:
    def __init__(self, agent_id: str, role: str):
        self.agent_id = agent_id
        self.role = role # e.g., "tier1_support"
        self.manager_id = "manager_alpha" # Default manager

    async def process_task(self, transcript_segment: str):
        """
        Process a call segment using available legacy tools.
        """
        # 1. Load Legacy Agents
        agents = agent_loader.load_agents()
        
        results = {}
        
        # 2. Run Sentiment (Simulated Legacy Call)
        # In real impl, we call the agents.get("sentiment").run(transcript_segment)
        # Using mock for stability as per previous step
        sentiment_score = -0.5 if "late" in transcript_segment.lower() else 0.5
        results["sentiment"] = {
            "score": sentiment_score,
            "label": "Negative" if sentiment_score < 0 else "Positive"
        }

        # 3. Run Extraction
        if "late" in transcript_segment.lower():
            results["issues"] = ["Late Delivery"]
        
        # 4. Report to Manager via Bus
        await global_bus.publish(
            channel="agent_updates",
            sender=self.agent_id,
            payload={
                "type": "task_complete",
                "results": results,
                "transcript_snippet": transcript_segment[:50]
            }
        )

        # 5. Save to MongoDB (Persistence)
        from app.core.database import get_database
        from app.models.db_models import CallLog
        import datetime
        import uuid

        try:
            db = await get_database()
            if db:
                call_id = str(uuid.uuid4())
                log_entry = CallLog(
                    call_id=call_id,
                    agent_id=self.agent_id,
                    transcript=transcript_segment,
                    timestamp=datetime.datetime.utcnow(),
                    analysis=results
                )
                await db["call_logs"].insert_one(log_entry.dict())
                print(f"💾 Saved Call Analysis {call_id} to MongoDB")
                results["call_id"] = call_id
        except Exception as e:
            print(f"❌ Failed to save to DB: {e}")
        
        return results

    async def receive_coaching(self, feedback: str):
        # Handle feedback (e.g., store in memory, adjust prompt)
        print(f"🎓 Agent {self.agent_id} received coaching: {feedback}")
