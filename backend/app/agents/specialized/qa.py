from app.agents.base import BaseAgent
from typing import Dict, Any
import logging

logger = logging.getLogger("QA_AGENT")

class QAScoringAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="QAScoringAgent",
            role="You are a Quality Assurance Specialist. You evaluate customer service calls based on strict quality criteria."
        )
        logger.info("📊 QA Scoring Agent initialized")

    async def run(self, transcript: str) -> Dict[str, Any]:
        logger.info(f"📊 [QA] Evaluating call quality ({len(transcript)} chars)")
        
        prompt = f"""
Evaluate the following customer service call transcript for Quality Assurance.

TRANSCRIPT:
{transcript}

SCORING CRITERIA (Total 100 points):
- Greeting & Closing (10 points): Professional opening and closing of the call
- Empathy & Tone (20 points): Showing understanding, active listening, appropriate tone
- Solution Accuracy (40 points): Correctly addressing the customer's issue, providing accurate information
- Efficiency (10 points): Handling the call without unnecessary delays
- Compliance (20 points): Following proper procedures, verification, legal requirements

Score each category and provide an overall assessment.

You MUST respond with ONLY this JSON format, no other text:

{{
    "total_score": <0-100 integer>,
    "breakdown": {{
        "greeting": <0-10 integer>,
        "empathy": <0-20 integer>,
        "solution": <0-40 integer>,
        "efficiency": <0-10 integer>,
        "compliance": <0-20 integer>
    }},
    "critical_fail": <true if any major issue like rudeness or misinformation, else false>,
    "comments": "<Brief summary of the agent's performance>"
}}
"""
        result = await self._invoke_llm(prompt)
        logger.info(f"📊 [QA] Complete - Total Score: {result.get('total_score', 'N/A')}, Critical Fail: {result.get('critical_fail', 'N/A')}")
        return result
