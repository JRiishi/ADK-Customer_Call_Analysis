from app.agents.base import BaseAgent
from typing import Dict, Any, List
import logging

logger = logging.getLogger("SOP_AGENT")

class SOPComplianceAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="SOPComplianceAgent",
            role="You are a strict QA Compliance Officer. You verify if customer service agents followed the Standard Operating Procedure (SOP) during calls."
        )
        logger.info("📋 SOP Compliance Agent initialized")

    async def run(self, transcript: str, sop_steps: List[str] = None) -> Dict[str, Any]:
        default_steps = [
            "Professional Greeting",
            "Customer Verification", 
            "Empathetic Response",
            "Solution Provided",
            "Proper Closing"
        ]
        steps = sop_steps or default_steps
        steps_str = "\n".join([f"- {s}" for s in steps])
        
        logger.info(f"📋 [SOP] Checking compliance against {len(steps)} steps")
        
        prompt = f"""
Verify if the customer service agent followed these SOP steps in the transcript.

REQUIRED SOP STEPS:
{steps_str}

TRANSCRIPT:
{transcript}

For each step, determine if it was followed (pass) or missed (fail), and provide evidence from the transcript.

You MUST respond with ONLY this JSON format, no other text:

{{
    "adherence_score": <0-100 integer representing percentage of steps passed>,
    "compliant": <true if adherence_score >= 80, else false>,
    "missed_steps": ["<step name>", ...],
    "checklist": [
        {{ "step": "<step name>", "status": "<pass|fail>", "evidence": "<quote or description from transcript>" }},
        ...
    ]
}}
"""
        result = await self._invoke_llm(prompt)
        logger.info(f"📋 [SOP] Complete - Adherence: {result.get('adherence_score', 'N/A')}%, Compliant: {result.get('compliant', 'N/A')}")
        return result
