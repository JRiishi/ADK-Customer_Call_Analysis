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
Analyze the following call transcript for sentiment.

TRANSCRIPT:
{transcript}

TASK:
1. Determine overall sentiment score (-100 to +100, where -100 is very negative, 0 is neutral, +100 is very positive).
2. Identify the sentiment at the Beginning (Opening), Middle, and End (Closing) phases.
3. Flag if any escalation indicators are present (threats to cancel, legal mentions, extreme frustration).

You MUST respond with ONLY this JSON format, no other text:

{{
    "score": <integer from -100 to 100>,
    "trajectory": [
        {{ "phase": "Opening", "score": <integer>, "label": "<sentiment label>" }},
        {{ "phase": "Middle", "score": <integer>, "label": "<sentiment label>" }},
        {{ "phase": "Closing", "score": <integer>, "label": "<sentiment label>" }}
    ],
    "label": "<Positive|Neutral|Negative>",
    "escalation_detected": <true|false>
}}
"""
        result = await self._invoke_llm(prompt)
        logger.info(f"🎭 [SENTIMENT] Complete - Score: {result.get('score', 'N/A')}, Label: {result.get('label', 'N/A')}")
        return result
