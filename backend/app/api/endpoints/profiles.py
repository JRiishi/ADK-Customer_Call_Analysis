from fastapi import APIRouter, HTTPException
from app.core.database import get_database
from app.models.db_models import AgentProfile
import random

router = APIRouter()

@router.get("/{agent_id}", response_model=AgentProfile)
async def get_profile(agent_id: str):
    db = await get_database()
    profile = await db["profiles"].find_one({"agent_id": agent_id})
    
    if not profile:
        # Create default profile if missing (Auto-onboarding)
        profile = AgentProfile(
            agent_id=agent_id, 
            name=f"Agent {agent_id.split('_')[-1]}",
            skills={"Empathy": random.randint(50, 90), "Efficiency": random.randint(60, 95)}
        )
        await db["profiles"].insert_one(profile.dict())
        
    if "_id" in profile: del profile["_id"]
    return profile

@router.post("/{agent_id}/assign_buddy")
async def assign_buddy(agent_id: str):
    """
    Smart Buddy Matching Logic:
    Finds a high-performing agent (> Lvl 3) to buddy with this agent.
    """
    db = await get_database()
    
    # Find potential mentors
    mentors_cursor = db["profiles"].find({"level": {"$gte": 3}})
    mentors = await mentors_cursor.to_list(length=10)
    
    if not mentors:
         # Mock mentor if none found in DB yet
         mentor_id = "agent_senior_007"
    else:
        # Pick one that isn't the requester
        valid_mentors = [m for m in mentors if m["agent_id"] != agent_id]
        if valid_mentors:
            mentor_id = valid_mentors[0]["agent_id"]
        else:
            mentor_id = "agent_senior_007"
            
    # Update Profile
    await db["profiles"].update_one(
        {"agent_id": agent_id},
        {"$set": {"buddy_id": mentor_id}}
    )
    
    return {"status": "success", "buddy_id": mentor_id, "message": "Buddy assigned for coaching."}
