from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException, Form, Depends
from typing import Dict, Any, List
from app.services.analysis_service import analysis_service
from app.core.database import get_database
from app.core.config import settings
from motor.motor_asyncio import AsyncIOMotorClient
import certifi
import shutil
import uuid
import logging
import datetime
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("ANALYSIS_API")

router = APIRouter()

UPLOAD_DIR = "app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/analyze")
async def trigger_analysis(payload: Dict[str, Any], background_tasks: BackgroundTasks):
    """Trigger analysis for a text transcript"""
    call_id = payload.get("call_id") or f"call_{uuid.uuid4().hex[:8]}"
    transcript = payload.get("transcript")
    
    logger.info(f"📨 [API] /analyze received for call_id: {call_id}")
    
    if not transcript:
        logger.error("❌ [API] Missing transcript in request")
        raise HTTPException(status_code=400, detail="Missing transcript")
    
    logger.info(f"📝 [API] Transcript length: {len(transcript)} chars")
    
    # Create initial call record
    db = await get_database()
    if db is not None:
        await db["calls"].update_one(
            {"_id": call_id},
            {
                "$set": {
                    "_id": call_id,
                    "status": "processing",
                    "started_at": datetime.datetime.utcnow(),
                    "transcript": transcript[:500] + "..." if len(transcript) > 500 else transcript
                }
            },
            upsert=True
        )
        logger.info(f"💾 [API] Initial record created for {call_id}")
        
    # Trigger async analysis
    logger.info(f"🚀 [API] Queuing background analysis for {call_id}")
    background_tasks.add_task(analysis_service.analyze_call, call_id, transcript, False)
    
    return {"status": "queued", "call_id": call_id, "message": "Analysis started in background"}

@router.post("/upload")
async def upload_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    agent_id: str = Form("agent_007")
):
    """Upload audio file for analysis"""
    logger.info(f"📨 [API] /upload received - File: {file.filename}, Agent: {agent_id}")
    
    try:
        call_id = f"call_{uuid.uuid4().hex[:8]}"
        
        # Save file locally
        file_path = os.path.join(UPLOAD_DIR, f"{call_id}_{file.filename}")
        logger.info(f"💾 [API] Saving file to: {file_path}")
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        file_size = os.path.getsize(file_path)
        logger.info(f"✅ [API] File saved: {file_size} bytes")
            
        db = await get_database()
        
        new_call = {
            "_id": call_id,
            "agent_id": agent_id,
            "status": "processing",
            "started_at": datetime.datetime.utcnow(),
            "transcript": None,
            "audio_path": file_path,
            "metadata": {"filename": file.filename, "size": file.size}
        }
        await db["calls"].insert_one(new_call)
        logger.info(f"💾 [API] Call record created: {call_id}")

        # Trigger Analysis with AUDIO PATH
        logger.info(f"🚀 [API] Queuing audio analysis for {call_id}")
        background_tasks.add_task(analysis_service.analyze_call, call_id, file_path, True)
        
        return {"call_id": call_id, "status": "processing", "message": "Audio uploaded, transcription and analysis started."}
        
    except Exception as e:
        logger.error(f"❌ [API] Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{call_id}")
async def get_analysis(call_id: str):
    """Get analysis results for a specific call"""
    logger.info(f"📨 [API] GET /{call_id}")
    
    db = await get_database()
    call = await db["calls"].find_one({"_id": call_id})
    
    if not call:
        logger.warning(f"⚠️ [API] Call not found: {call_id}")
        raise HTTPException(status_code=404, detail="Call not found")
    
    logger.info(f"✅ [API] Returning call data - Status: {call.get('status', 'unknown')}")
    return call

@router.get("/dashboard/stats")
async def get_dashboard_stats():
    """Get aggregated dashboard statistics"""
    logger.info("📨 [API] GET /dashboard/stats")
    
    db = await get_database()
    
    # Aggregations
    pipeline = [
        {
            "$group": {
                "_id": None,
                "avg_sentiment": {"$avg": "$scores.sentiment"},
                "avg_sop": {"$avg": "$scores.sop"},
                "avg_qa": {"$avg": "$scores.qa"},
                "total_calls": {"$sum": 1},
                "risk_count": {
                    "$sum": {"$cond": [{"$eq": ["$scores.risk", 100]}, 1, 0]}
                }
            }
        }
    ]
    
    try:
        stats_cursor = db["calls"].aggregate(pipeline)
        stats = await stats_cursor.to_list(length=1)
        stats = stats[0] if stats else {}
        
        # Agent Performance
        agent_perf_cursor = db["calls"].aggregate([
            {"$group": {
                "_id": "$agent_id",
                "avg_score": {"$avg": "$scores.qa"},
                "calls": {"$sum": 1},
                "avg_sentiment": {"$avg": "$scores.sentiment"}
            }},
            {"$limit": 5}
        ])
        agent_perf = await agent_perf_cursor.to_list(length=5)
        
        formatted_agents = [
            {
                "name": agent["_id"] or "Unknown",
                "score": round(agent.get("avg_score", 0) or 0, 1),
                "calls": agent.get("calls", 0),
                "sentiment": round(agent.get("avg_sentiment", 0) or 0, 1)
            } 
            for agent in agent_perf
        ]

        result = {
            "metrics": [
                { "label": "Team QA Avg", "value": f"{round(stats.get('avg_qa', 0) or 0, 1)}%", "trend": "Stable", "positive": True },
                { "label": "Total Calls", "value": str(stats.get('total_calls', 0)), "trend": "+", "positive": True },
                { "label": "Compliance Rate", "value": f"{round(stats.get('avg_sop', 0) or 0, 1)}%", "trend": "Stable", "positive": True },
                { "label": "Risks Detected", "value": str(stats.get('risk_count', 0)), "trend": "Stable", "positive": False }
            ],
            "agent_performance": formatted_agents
        }
        
        logger.info(f"✅ [API] Dashboard stats: {stats.get('total_calls', 0)} calls")
        return result
        
    except Exception as e:
        logger.error(f"❌ [API] Error generating stats: {e}")
        return {"metrics": [], "agent_performance": []}

@router.get("/")
async def list_analyses():
    """List all call analyses"""
    logger.info("📨 [API] GET / (list all)")
    
    db = await get_database()
    cursor = db["calls"].find({}).sort("started_at", -1).limit(50)
    calls = await cursor.to_list(length=50)
    
    logger.info(f"✅ [API] Returning {len(calls)} calls")
    return calls

@router.get("/agent/{agent_id}")
async def get_agent_history(agent_id: str):
    """Get call history for a specific agent"""
    logger.info(f"📨 [API] GET /agent/{agent_id}")
    
    db = await get_database()
    cursor = db["calls"].find({"agent_id": agent_id}).sort("started_at", -1).limit(20)
    calls = await cursor.to_list(length=20)
    
    logger.info(f"✅ [API] Returning {len(calls)} calls for agent {agent_id}")
    return calls
