from fastapi import APIRouter, HTTPException, Body
from app.core.database import get_database
from app.models.db import SOP
from typing import List

router = APIRouter()

@router.post("/", response_model=SOP)
async def create_sop(sop: SOP):
    db = await get_database()
    sop_dict = sop.dict(by_alias=True)
    await db["sops"].insert_one(sop_dict)
    return sop

@router.get("/", response_model=List[SOP])
async def list_sops():
    db = await get_database()
    cursor = db["sops"].find({"active": True})
    sops = await cursor.to_list(length=100)
    return sops

@router.put("/{sop_id}", response_model=SOP)
async def update_sop(sop_id: str, sop_update: dict = Body(...)):
    db = await get_database()
    await db["sops"].update_one({"_id": sop_id}, {"$set": sop_update})
    updated = await db["sops"].find_one({"_id": sop_id})
    return updated

@router.delete("/{sop_id}")
async def delete_sop(sop_id: str):
    db = await get_database()
    await db["sops"].delete_one({"_id": sop_id})
    return {"status": "deleted"}
