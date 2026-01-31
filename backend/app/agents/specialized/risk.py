from app.agents.base import BaseAgent
from typing import Dict, Any
import logging

logger = logging.getLogger("RISK_AGENT")

class RiskDetectionAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="RiskDetectionAgent",
            role="You are a Risk Management AI specialized in identifying churn risks, legal threats, and compliance violations in customer service calls."
        )
        logger.info("⚠️ Risk Detection Agent initialized")

    async def run(self, transcript: str) -> Dict[str, Any]:
        logger.info(f"⚠️ [RISK] Scanning transcript for risk indicators ({len(transcript)} chars)")
        
        prompt = f"""
Scan this customer service transcript for high-risk markers.

RISK CATEGORIES TO CHECK:
- Churn Risk: Customer threatening to cancel, leave, switch to competitor
- Legal Risk: Mentions of lawsuit, lawyer, attorney, suing, court, legal action
- Compliance Risk: Profanity, abuse, data breach mentions, privacy violations

TRANSCRIPT:
{transcript}

Analyze carefully and identify any risk flags with their severity.

You MUST respond with ONLY this JSON format, no other text:

{{
    "risk_detected": <true if any risks found, else false>,
    "severity": "<low|medium|high|critical>",
    "flags": [
        {{ "category": "<Churn|Legal|Compliance>", "confidence": "<low|medium|high>", "quote": "<relevant quote from transcript>" }},
        ...
    ],
    "summary": "<Brief risk assessment summary>"
}}

If no risks detected, return empty flags array and severity "low".
"""
        result = await self._invoke_llm(prompt)
        logger.info(f"⚠️ [RISK] Complete - Detected: {result.get('risk_detected', 'N/A')}, Severity: {result.get('severity', 'N/A')}")
        return result
