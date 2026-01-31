from fastapi import APIRouter, UploadFile, File, HTTPException
from app.agents.hierarchy.worker import WorkerAgent
from app.agents.hierarchy.manager import ManagerAgent
import shutil
import os
import uuid

router = APIRouter()

# Instantiate Singletons for demo
# In prod, these would be managed by a dependency injector or registry
manager = ManagerAgent("manager_01")
worker = WorkerAgent("worker_01", "support")

# Quick startup in global scope (not ideal for prod but works for this scale)
import asyncio
@router.on_event("startup")
async def startup_hierarchy():
    await manager.start()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/audio")
async def upload_audio(file: UploadFile = File(...)):
    """
    Upload an audio file, save it, transcribe it (simulated), and run the Agent Hierarchy.
    """
    try:
        file_id = str(uuid.uuid4())
        file_ext = file.filename.split(".")[-1]
        file_path = f"{UPLOAD_DIR}/{file_id}.{file_ext}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Simulate Transcription (mocking the Transcription Agent for speed)
        # In real impl, call Transcription Agent here
        simulated_transcript = "Customer: I am very unhappy with the delay. Agent: I understand, let me refund you."
        
        # Trigger Worker
        result = await worker.process_task(simulated_transcript)
        
        return {
            "status": "success",
            "file_id": file_id,
            "transcript": simulated_transcript,
            "analysis": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
