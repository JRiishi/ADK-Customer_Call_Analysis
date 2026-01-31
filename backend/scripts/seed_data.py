import asyncio
import datetime
import uuid
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import db
from app.core.config import settings

async def seed_data():
    print("🌱 Seeding Database...")
    db.connect()
    
    # --- AGENTS ---
    agents = [
        {"_id": "agent_001", "name": "James Bond", "department": "Retention", "skills": {"Empathy": 90, "Speed": 95}, "joined_at": datetime.datetime.utcnow()},
        {"_id": "agent_002", "name": "Sarah Connor", "department": "Support", "skills": {"Empathy": 70, "Speed": 99}, "joined_at": datetime.datetime.utcnow()},
        {"_id": "agent_003", "name": "Ellen Ripley", "department": "Technical", "skills": {"Empathy": 85, "Technical": 100}, "joined_at": datetime.datetime.utcnow()},
    ]
    for a in agents:
        await db.db["agents"].replace_one({"_id": a["_id"]}, a, upsert=True)
    print(f"✅ Seeded {len(agents)} Agents")

    # --- CALLS ---
    calls = [
        {
            "_id": "call_demo_01",
            "agent_id": "agent_001",
            "transcript": "Agent: Hello, thanks for calling. How can I help?\nCustomer: I want to cancel immediately! Your service is terrible.\nAgent: I'm so sorry to hear that. I can see you've been with us for 2 years. What specifically went wrong?\nCustomer: The billing is always wrong.\nAgent: I understand your frustration. Let me fix that for you right now and apply a credit.",
            "started_at": datetime.datetime.utcnow() - datetime.timedelta(hours=2),
            "status": "completed",
            "scores": {"compliance": 95, "sentiment": 60, "risk": 80},
            "analysis": {
                "call_id": "call_demo_01",
                "summary": {"sentiment_score": 60, "sop_score": 95, "risk_severity": "medium"},
                "sentiment": {
                    "score": 60,
                    "trajectory": [
                        {"phase": "Start", "score": 20, "label": "Angry"},
                        {"phase": "Middle", "score": 50, "label": "Neutral"},
                        {"phase": "End", "score": 80, "label": "Satisfied"}
                    ]
                },
                "sop_compliance": {
                    "adherence_score": 95,
                    "checklist": [
                        {"step": "Greeting", "status": "pass", "evidence": "Hello, thanks for calling"},
                        {"step": "Empathy", "status": "pass", "evidence": "I'm so sorry to hear that"},
                        {"step": "Solution", "status": "pass", "evidence": "Apply a credit"}
                    ]
                },
                "risk_analysis": {
                    "risk_detected": True,
                    "severity": "medium",
                    "flags": [{"category": "Churn", "confidence": "high", "quote": "want to cancel immediately"}]
                }
            }
        },
        {
            "_id": "call_demo_02",
            "agent_id": "agent_002",
            "transcript": "Agent: Hi.\nCustomer: My internet is down.\nAgent: Okay, reboot the router.\nCustomer: I did that already.\nAgent: Well do it again.",
            "started_at": datetime.datetime.utcnow() - datetime.timedelta(hours=5),
            "status": "completed",
            "scores": {"compliance": 40, "sentiment": 20, "risk": 20},
            "analysis": {
                "call_id": "call_demo_02",
                "summary": {"sentiment_score": 20, "sop_score": 40, "risk_severity": "low"},
                "sentiment": {
                    "score": 20,
                    "trajectory": [
                        {"phase": "Start", "score": 40, "label": "Annoyed"},
                        {"phase": "End", "score": 10, "label": "Angry"}
                    ]
                },
                "sop_compliance": {
                    "adherence_score": 40,
                    "checklist": [
                        {"step": "Greeting", "status": "fail", "evidence": "Hi (Too short)"},
                        {"step": "Empathy", "status": "fail", "evidence": "N/A"}
                    ]
                },
                "risk_analysis": {"risk_detected": False, "flags": []}
            }
        }
    ]
    for c in calls:
        await db.db["calls"].replace_one({"_id": c["_id"]}, c, upsert=True)
    print(f"✅ Seeded {len(calls)} Calls")

    db.close()

if __name__ == "__main__":
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(seed_data())
