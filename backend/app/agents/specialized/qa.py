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
[TASK: QA SCORING - Return numerical scores ONLY]

You are evaluating a CUSTOMER SERVICE CALL for Quality Assurance.

TRANSCRIPT TO EVALUATE:
---
{transcript}
---

SCORING RUBRIC (Maximum 100 points total):
1. Greeting & Closing (max 10 points): Did agent greet professionally and close properly?
2. Empathy & Tone (max 20 points): Did agent show understanding and use appropriate tone?
3. Solution Accuracy (max 40 points): Did agent correctly address the issue with accurate info?
4. Efficiency (max 10 points): Was the call handled without unnecessary delays?
5. Compliance (max 20 points): Did agent follow verification and proper procedures?

CALCULATE: Add up all category scores for total_score (0-100).

RESPOND WITH THIS EXACT JSON STRUCTURE (no other text):
{{{{
    "total_score": <INTEGER 0-100>,
    "breakdown": {{{{
        "greeting": <INTEGER 0-10>,
        "empathy": <INTEGER 0-20>,
        "solution": <INTEGER 0-40>,
        "efficiency": <INTEGER 0-10>,
        "compliance": <INTEGER 0-20>
    }}}},
    "critical_fail": <BOOLEAN true/false>,
    "comments": "<ONE SENTENCE summary>"
}}}}
"""
        result = await self._invoke_llm(prompt)
        
        # Ensure total_score exists
        if 'total_score' not in result and 'breakdown' in result:
            breakdown = result.get('breakdown', {})
            result['total_score'] = sum([
                breakdown.get('greeting', 0),
                breakdown.get('empathy', 0),
                breakdown.get('solution', 0),
                breakdown.get('efficiency', 0),
                breakdown.get('compliance', 0)
            ])
        elif 'total_score' not in result:
            # Fallback: try to extract from adherence_score if model confused
            result['total_score'] = result.get('adherence_score', 50)
        
        logger.info(f"📊 [QA] Complete - Total Score: {result.get('total_score', 'N/A')}, Critical Fail: {result.get('critical_fail', 'N/A')}")
        return result
