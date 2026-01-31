from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
import datetime

class CallLog(BaseModel):
    call_id: str
    agent_id: str
    transcript: str
    timestamp: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    analysis: Dict[str, Any] # Full JSON Output from agents
    audio_path: Optional[str] = None
    
    # New: Detailed analysis fields
    soph_check_results: Optional[Dict[str, bool]] = None
    risk_markers: Optional[List[Dict[str, Any]]] = None

class SOP(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    steps: List[str] # ["Greeting", "Empathy", "Solution"]
    active: bool = True
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

class AgentProfile(BaseModel):
    agent_id: str
    name: str
    level: int = 1
    skills: Dict[str, int] = {} # {"Empathy": 80, "Speed": 90}
    buddy_id: Optional[str] = None # Paired "Buddy" for coaching
    joined_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
