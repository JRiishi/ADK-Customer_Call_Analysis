from fastapi import APIRouter, HTTPException, Depends
from app.core.database import get_database
from app.models.db_models import CallLog

router = APIRouter()

@router.get("/{call_id}")
async def get_analysis(call_id: str):
    db = await get_database()
    if not db:
        raise HTTPException(status_code=503, detail="Database not connected")
        
    doc = await db["call_logs"].find_one({"call_id": call_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Remove ObjectID for JSON serialization
    if "_id" in doc:
        del doc["_id"]
        
    return doc
