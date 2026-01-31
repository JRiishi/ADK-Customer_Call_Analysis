from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.models.db_models import BuddyPair, AgentProfile
from app.core.database import db
from pydantic import BaseModel
import logging

logger = logging.getLogger("BUDDY_API")
router = APIRouter()

class BuddyAssignmentRequest(BaseModel):
    mentee_id: str
    mentor_id: str
    mentee_name: str
    mentor_name: str
    notes: Optional[str] = None

@router.post("/assign", response_model=BuddyPair)
async def assign_buddy(request: BuddyAssignmentRequest):
    """
    Assign a buddy (mentor) to an agent (mentee)
    """
    try:
        # Create buddy pair
        buddy_pair = BuddyPair(
            mentee_id=request.mentee_id,
            mentor_id=request.mentor_id,
            mentee_name=request.mentee_name,
            mentor_name=request.mentor_name,
            notes=request.notes,
            status="active"
        )
        
        # Store in database
        result = db.buddy_pairs.insert_one(buddy_pair.dict())
        
        # Update agent profiles to link buddy
        db.agent_profiles.update_one(
            {"agent_id": request.mentee_id},
            {"$set": {"buddy_id": request.mentor_id}},
            upsert=True
        )
        
        logger.info(f"✅ Buddy assigned: {request.mentor_name} -> {request.mentee_name}")
        
        return buddy_pair
        
    except Exception as e:
        logger.error(f"❌ Error assigning buddy: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pairs", response_model=List[dict])
async def get_all_buddy_pairs(status: Optional[str] = None):
    """
    Get all buddy pairs, optionally filtered by status
    """
    try:
        query = {}
        if status:
            query["status"] = status
            
        pairs = list(db.buddy_pairs.find(query))
        
        # Convert ObjectId to string
        for pair in pairs:
            pair["_id"] = str(pair["_id"])
            
        return pairs
        
    except Exception as e:
        logger.error(f"❌ Error fetching buddy pairs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/agent/{agent_id}")
async def get_agent_buddy_info(agent_id: str):
    """
    Get buddy information for a specific agent
    Returns both if they are a mentee (has a mentor) or a mentor (helping others)
    """
    try:
        # Check if agent is a mentee (has a mentor)
        as_mentee = db.buddy_pairs.find_one({
            "mentee_id": agent_id,
            "status": "active"
        })
        
        # Check if agent is a mentor (helping others)
        as_mentor = list(db.buddy_pairs.find({
            "mentor_id": agent_id,
            "status": "active"
        }))
        
        # Get agent profile
        profile = db.agent_profiles.find_one({"agent_id": agent_id})
        
        result = {
            "agent_id": agent_id,
            "has_buddy": as_mentee is not None,
            "is_mentoring": len(as_mentor) > 0,
            "buddy_info": None,
            "mentees": []
        }
        
        if as_mentee:
            as_mentee["_id"] = str(as_mentee["_id"])
            result["buddy_info"] = {
                "mentor_id": as_mentee["mentor_id"],
                "mentor_name": as_mentee["mentor_name"],
                "assigned_at": as_mentee["assigned_at"],
                "notes": as_mentee.get("notes")
            }
        
        if as_mentor:
            for mentee_pair in as_mentor:
                result["mentees"].append({
                    "mentee_id": mentee_pair["mentee_id"],
                    "mentee_name": mentee_pair["mentee_name"],
                    "assigned_at": mentee_pair["assigned_at"]
                })
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Error fetching buddy info for {agent_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/remove/{pair_id}")
async def remove_buddy_pair(pair_id: str):
    """
    Remove/deactivate a buddy pair
    """
    try:
        # Update status to cancelled
        result = db.buddy_pairs.update_one(
            {"id": pair_id},
            {"$set": {"status": "cancelled"}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Buddy pair not found")
        
        # Get the pair to update agent profile
        pair = db.buddy_pairs.find_one({"id": pair_id})
        if pair:
            db.agent_profiles.update_one(
                {"agent_id": pair["mentee_id"]},
                {"$set": {"buddy_id": None}}
            )
        
        logger.info(f"✅ Buddy pair {pair_id} removed")
        
        return {"message": "Buddy pair removed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error removing buddy pair: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_buddy_stats():
    """
    Get statistics about buddy system
    """
    try:
        total_pairs = db.buddy_pairs.count_documents({"status": "active"})
        total_mentees = db.buddy_pairs.count_documents({"status": "active"})
        
        # Get unique mentors
        mentors = db.buddy_pairs.distinct("mentor_id", {"status": "active"})
        
        return {
            "total_active_pairs": total_pairs,
            "total_mentees": total_mentees,
            "total_mentors": len(mentors)
        }
        
    except Exception as e:
        logger.error(f"❌ Error fetching buddy stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
