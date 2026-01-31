from fastapi import APIRouter, HTTPException, Body
from app.core.database import get_database
from app.models.db_models import SOP
from typing import List
import uuid

router = APIRouter()

@router.post("/", response_model=SOP)
async def create_sop(sop: SOP):
    db = await get_database()
    sop_dict = sop.dict()
    await db["sops"].insert_one(sop_dict)
    return sop

@router.get("/", response_model=List[SOP])
async def list_sops():
    db = await get_database()
    cursor = db["sops"].find({"active": True})
    sops = await cursor.to_list(length=100)
    return sops

@router.put("/{sop_id}")
async def update_sop(sop_id: str, steps: List[str] = Body(...)):
    db = await get_database()
    res = await db["sops"].update_one(
        {"id": sop_id},
        {"$set": {"steps": steps}}
    )
    if res.modified_count == 0:
        raise HTTPException(status_code=404, detail="SOP not found")
    return {"status": "updated", "id": sop_id}
