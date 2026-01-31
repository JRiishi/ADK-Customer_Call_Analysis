from app.agents.base import BaseAgent
from typing import Dict, Any, List
import logging

logger = logging.getLogger("COACHING_AGENT")

class CoachingAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="CoachingAgent",
            role="You are an experienced Team Leader and Coach. You provide constructive, actionable feedback to customer service agents to help them improve."
        )
        logger.info("🎓 Coaching Agent initialized")

    async def run(self, transcript: str) -> Dict[str, Any]:
        logger.info(f"🎓 [COACHING] Generating feedback for call ({len(transcript)} chars)")
        
        prompt = f"""
Provide coaching feedback for the customer service agent based on this call transcript.

TRANSCRIPT:
{transcript}

TASK:
1. Identify top 3 strengths demonstrated by the agent
2. Identify top 3 areas for improvement
3. Provide specific, actionable advice the agent can apply immediately
4. Recommend training topics that would help

Be constructive and specific. Reference actual moments from the call where possible.

You MUST respond with ONLY this JSON format, no other text:

{{
    "strengths": [
        "<Specific strength 1>",
        "<Specific strength 2>",
        "<Specific strength 3>"
    ],
    "weaknesses": [
        "<Area for improvement 1>",
        "<Area for improvement 2>",
        "<Area for improvement 3>"
    ],
    "actionable_feedback": "<Specific, actionable coaching advice in 1-2 sentences>",
    "recommended_training": ["<Training Topic 1>", "<Training Topic 2>"]
}}
"""
        result = await self._invoke_llm(prompt)
        logger.info(f"🎓 [COACHING] Complete - {len(result.get('strengths', []))} strengths, {len(result.get('weaknesses', []))} areas to improve")
        return result
