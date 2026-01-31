from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from datetime import datetime, timedelta
from app.core.database import db
from app.models.db import Agent, Call

router = APIRouter()

@router.get("/profile/{agent_id}")
async def get_agent_profile(agent_id: str):
    # 1. Get or Create Agent
    agent_data = await db.agents.find_one({"_id": agent_id})
    if not agent_data:
        # Create default agent if not exists
        new_agent = Agent(
            _id=agent_id,
            name="Agent " + agent_id[-4:],
            department="Customer Support",
            skills={"Communication": 70, "Empathy": 70, "Technical": 60}
        )
        await db.agents.insert_one(new_agent.dict(by_alias=True))
        agent_data = new_agent.dict(by_alias=True)
    
    # 2. Aggregate Call Data
    pipeline = [
        {"$match": {"agent_id": agent_id, "status": "completed"}},
        {"$project": {
            "sentiment_score": "$analysis.sentiment.score",
            "qa_score": "$scores.qa_score",
            "sop_score": "$scores.sop_score",
            "risk_detected": "$analysis.risk_analysis.risk_detected",
            "duration": "$duration_seconds",
            "started_at": 1
        }}
    ]
    
    calls = await db.calls.find({"agent_id": agent_id, "status": "completed"}).sort("started_at", -1).limit(50).to_list(length=50)
    
    # Calculate Stats
    total_calls = len(calls)
    avg_sentiment = 0
    avg_sop = 0
    avg_qa = 0
    risk_count = 0
    
    if total_calls > 0:
        avg_sentiment = sum([c.get("analysis", {}).get("sentiment", {}).get("score", 0) or 0 for c in calls]) / total_calls
        # Handle different structures if score is flat or nested
        avg_sop = sum([c.get("scores", {}).get("sop_score", 0) or 0 for c in calls]) / total_calls
        avg_qa = sum([c.get("scores", {}).get("qa_score", 0) or 0 for c in calls]) / total_calls
        risk_count = sum([1 for c in calls if c.get("analysis", {}).get("risk_analysis", {}).get("risk_detected", False)])

    return {
        "agent": {
            "name": agent_data.get("name", "Unknown Agent"),
            "id": agent_id,
            "department": agent_data.get("department", "General"),
            "joined_at": agent_data.get("created_at")
        },
        "stats": {
            "total_calls": total_calls,
            "avg_sentiment": round(avg_sentiment, 1),
            "avg_sop": round(avg_sop, 1),
            "avg_qa": round(avg_qa, 1),
            "risk_rate": round((risk_count / total_calls * 100) if total_calls > 0 else 0, 1),
            "total_hours": round(sum([c.get("duration_seconds", 0) or 0 for c in calls]) / 3600, 2)
        },
        "recent_history": [
            {
                "date": c.get("started_at").strftime("%Y-%m-%d") if c.get("started_at") else "N/A",
                "score": c.get("scores", {}).get("qa_score", 0) or 0,
                "sentiment": c.get("analysis", {}).get("sentiment", {}).get("score", 0) or 0
            } 
            for c in calls[:10] # Last 10 calls for charts
        ],
        "call_history": [
            {
                "id": str(c.get("_id", "")),
                "started_at": c.get("started_at").isoformat() if c.get("started_at") else None,
                "duration": c.get("duration_seconds", 0),
                "sentiment_score": c.get("analysis", {}).get("sentiment", {}).get("score", 0) or 0,
                "qa_score": c.get("scores", {}).get("qa_score", 0) or 0,
                "risk_detected": c.get("analysis", {}).get("risk_analysis", {}).get("risk_detected", False)
            }
            for c in calls
        ]
    }
