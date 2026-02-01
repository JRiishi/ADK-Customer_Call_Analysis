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
[TASK: RISK DETECTION - Identify threats and dangers ONLY]

You are a RISK ANALYST scanning for dangerous situations in customer calls.

TRANSCRIPT TO SCAN:
---
{transcript}
---

LOOK FOR THESE SPECIFIC RISKS:
1. CHURN RISK: Words like "cancel", "leave", "competitor", "switch provider", "close account"
2. LEGAL RISK: Words like "lawsuit", "lawyer", "attorney", "sue", "court", "legal action"
3. COMPLIANCE RISK: Profanity, threats, data breach mentions, harassment

DETERMINE:
- risk_detected: true if ANY of the above risks found, false if none
- severity: "none" if no risks, "low" for minor, "medium" for moderate, "high" for serious, "critical" for urgent

RESPOND WITH THIS EXACT JSON STRUCTURE (no other text):
{{{{
    "risk_detected": <BOOLEAN true/false>,
    "severity": "<none|low|medium|high|critical>",
    "flags": [
        {{{{
            "category": "<Churn|Legal|Compliance>",
            "confidence": "<low|medium|high>",
            "quote": "<exact words from transcript>"
        }}}}
    ],
    "summary": "<ONE SENTENCE risk summary>"
}}}}

IF NO RISKS FOUND, return: {{"risk_detected": false, "severity": "none", "flags": [], "summary": "No risks detected"}}
"""
        result = await self._invoke_llm(prompt)
        
        # Ensure required fields exist with defaults
        if 'risk_detected' not in result:
            result['risk_detected'] = False
        if 'severity' not in result:
            result['severity'] = 'none' if not result.get('risk_detected') else 'low'
        if 'flags' not in result:
            result['flags'] = []
        if 'summary' not in result:
            result['summary'] = 'No risks detected' if not result.get('risk_detected') else 'Risk analysis complete'
        
        logger.info(f"⚠️ [RISK] Complete - Detected: {result.get('risk_detected', 'N/A')}, Severity: {result.get('severity', 'N/A')}")
        return result
