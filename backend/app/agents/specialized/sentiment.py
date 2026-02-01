from app.agents.base import BaseAgent
from typing import Dict, Any
import logging

logger = logging.getLogger("SENTIMENT_AGENT")

class SentimentAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="SentimentTrajectoryAgent",
            role="You are an expert Sentiment Analyst. You analyze customer service calls for emotional shifts and sentiment patterns."
        )
        logger.info("🎭 Sentiment Agent initialized")

    async def run(self, transcript: str) -> Dict[str, Any]:
        logger.info(f"🎭 [SENTIMENT] Analyzing transcript ({len(transcript)} chars)")
        
        prompt = f"""
[TASK: SENTIMENT ANALYSIS - Return emotion scores ONLY]

You are analyzing CUSTOMER EMOTIONS in a service call.

TRANSCRIPT TO ANALYZE:
---
{transcript}
---

SCORING SCALE: -100 (very angry/negative) to +100 (very happy/positive), 0 is neutral

ANALYZE:
1. Overall sentiment score for the ENTIRE call
2. Sentiment at three phases: Opening, Middle, Closing
3. Whether customer escalated (threatened to cancel, mentioned lawyers, extreme anger)

RESPOND WITH THIS EXACT JSON STRUCTURE (no other text):
{{{{
    "score": <INTEGER from -100 to +100>,
    "trajectory": [
        {{{{ "phase": "Opening", "score": <INTEGER>, "label": "<Happy|Satisfied|Neutral|Frustrated|Angry>" }}}},
        {{{{ "phase": "Middle", "score": <INTEGER>, "label": "<Happy|Satisfied|Neutral|Frustrated|Angry>" }}}},
        {{{{ "phase": "Closing", "score": <INTEGER>, "label": "<Happy|Satisfied|Neutral|Frustrated|Angry>" }}}}
    ],
    "label": "<Positive|Neutral|Negative>",
    "escalation_detected": <BOOLEAN true/false>
}}}}

EXAMPLE for angry customer: {{"score": -60, "trajectory": [...], "label": "Negative", "escalation_detected": true}}
EXAMPLE for happy customer: {{"score": 75, "trajectory": [...], "label": "Positive", "escalation_detected": false}}
"""
        result = await self._invoke_llm(prompt)
        
        # Ensure required fields exist
        if 'score' not in result:
            result['score'] = 0
        if 'label' not in result:
            score = result.get('score', 0)
            result['label'] = 'Positive' if score > 20 else ('Negative' if score < -20 else 'Neutral')
        if 'trajectory' not in result:
            result['trajectory'] = [
                {"phase": "Opening", "score": result.get('score', 0), "label": result.get('label', 'Neutral')},
                {"phase": "Middle", "score": result.get('score', 0), "label": result.get('label', 'Neutral')},
                {"phase": "Closing", "score": result.get('score', 0), "label": result.get('label', 'Neutral')}
            ]
        if 'escalation_detected' not in result:
            result['escalation_detected'] = result.get('score', 0) < -50
        
        logger.info(f"🎭 [SENTIMENT] Complete - Score: {result.get('score', 'N/A')}, Label: {result.get('label', 'N/A')}")
        return result
