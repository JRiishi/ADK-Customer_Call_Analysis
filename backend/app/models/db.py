from pydantic import BaseModel, Field, EmailStr
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

class Call(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    agent_id: str
    transcript: str = ""
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[int] = 0
    status: str = "ongoing" # ongoing, completed, failed
    metadata: Dict[str, Any] = {}
    
    # Analysis Results (embedded)
    analysis: Optional[Dict[str, Any]] = None
    scores: Optional[Dict[str, Any]] = None

    class Config:
        populate_by_name = True

class Agent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    name: str
    email: Optional[EmailStr] = None
    department: str = "General"
    skills: Dict[str, int] = {}
    buddy_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class SOP(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    title: str
    department: str
    content: str # Markdown
    mandatory_keywords: List[str] = []
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class CoachingRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    agent_id: str
    call_id: str
    feedback: str
    effectiveness_score: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
