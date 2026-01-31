from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.core.database import db
from bson import ObjectId

router = APIRouter()

class RecommendationRequest(BaseModel):
    agent_id: str
    agent_name: str
    manager_id: str
    manager_name: str
    type: str  # "reward" or "training"
    priority: str  # "low", "medium", "high"
    reason: str
    metrics_snapshot: dict
    status: str = "pending"  # "pending", "approved", "rejected", "action_taken"

class RecommendationResponse(RecommendationRequest):
    id: str
    created_at: datetime
    updated_at: datetime

def serialize_doc(doc):
    if not doc:
        return None
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

@router.post("/send", response_model=RecommendationResponse)
async def send_recommendation(request: RecommendationRequest):
    new_rec = request.dict()
    new_rec["created_at"] = datetime.utcnow()
    new_rec["updated_at"] = datetime.utcnow()
    
    result = await db.db.manager_recommendations.insert_one(new_rec)
    new_rec["_id"] = result.inserted_id
    
    return serialize_doc(new_rec)

@router.get("/all", response_model=List[RecommendationResponse])
async def get_all_recommendations():
    cursor = db.db.manager_recommendations.find().sort("created_at", -1)
    recs = await cursor.to_list(length=100)
    return [serialize_doc(rec) for rec in recs]

@router.get("/manager/{manager_id}", response_model=List[RecommendationResponse])
async def get_manager_recommendations(manager_id: str):
    cursor = db.db.manager_recommendations.find({"manager_id": manager_id}).sort("created_at", -1)
    recs = await cursor.to_list(length=100)
    return [serialize_doc(rec) for rec in recs]

@router.patch("/status/{rec_id}")
async def update_status(rec_id: str, status: str):
    result = await db.db.manager_recommendations.update_one(
        {"_id": ObjectId(rec_id)},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return {"message": "Status updated successfully"}

@router.get("/stats")
async def get_recommendation_stats():
    total = await db.db.manager_recommendations.count_documents({})
    rewards = await db.db.manager_recommendations.count_documents({"type": "reward"})
    training = await db.db.manager_recommendations.count_documents({"type": "training"})
    pending = await db.db.manager_recommendations.count_documents({"status": "pending"})
    
    return {
        "total": total,
        "rewards": rewards,
        "training": training,
        "pending": pending
    }
