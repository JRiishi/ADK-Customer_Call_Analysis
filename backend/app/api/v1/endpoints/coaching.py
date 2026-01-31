from fastapi import APIRouter
from app.core.database import get_database

router = APIRouter()

@router.get("/summary")
async def get_coaching_summary():
    """
    Returns aggregated coaching stats for the dashboard.
    """
    db = await get_database()
    
    # 1. Calculate Skill Matrix (Avg of last 50 calls)
    pipeline = [
        {"$sort": {"started_at": -1}},
        {"$limit": 50},
        {"$group": {
            "_id": None,
            "avg_empathy": {"$avg": "$scores.sentiment"},
            "avg_qa": {"$avg": "$scores.qa"},
            "avg_sop": {"$avg": "$scores.sop"},
             # Mocking some dimensions as they might not be discrete metric in current simple schema
             # In a real system, 'scores' would have these breakdowns
        }}
    ]
    
    try:
        stats = await db["calls"].aggregate(pipeline).to_list(1)
        stats = stats[0] if stats else {}
        
        # Transform for Radar Chart
        skill_data = [
            {"subject": 'Empathy', "A": round(stats.get('avg_empathy', 0) or 0, 1), "fullMark": 100},
            {"subject": 'Compliance', "A": round(stats.get('avg_sop', 0) or 0, 1), "fullMark": 100},
            {"subject": 'Overall QA', "A": round(stats.get('avg_qa', 0) or 0, 1), "fullMark": 100},
            {"subject": 'Resolution', "A": 85, "fullMark": 100}, # Mocked for now
            {"subject": 'Speed', "A": 78, "fullMark": 100}, # Mocked for now
        ]
        
        # AI Recommendation (Static for now, but could be LLM generated from history)
        recommendation = "Based on recent performance, your Empathy score is improving. focus on Speed to reduce AHT."
        
        return {
            "skill_matrix": skill_data,
            "recommendation": recommendation,
            "modules": [
                {"title": "Handling Irate Customers", "type": "Video", "duration": "12 min", "status": "Pending"},
                {"title": "SOP V2.4 Updates", "type": "Document", "duration": "5 min", "status": "Completed"},
                {"title": "Active Listening Lab", "type": "Simulation", "duration": "15 min", "status": "In Progress"},
            ]
        }
    except Exception as e:
        print(f"Coaching stats error: {e}")
        return {}
