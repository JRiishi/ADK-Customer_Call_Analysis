from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List

class AgentInput(BaseModel):
    query: str = Field(..., description="User query or transcript text")
    session_id: Optional[str] = Field("default_session", description="Session ID for context")

class AgentResponse(BaseModel):
    agent_name: str
    output: Dict[str, Any]
    raw_response: Optional[str] = None

class OrchestratorRequest(BaseModel):
    transcript: str
    metadata: Optional[Dict[str, Any]] = {}

class OrchestratorResponse(BaseModel):
    issues: List[Dict[str, Any]] = []
    sentiment: Optional[Dict[str, Any]] = None
    classification: Optional[List[Dict[str, Any]]] = None
    insights: Optional[Dict[str, Any]] = None
