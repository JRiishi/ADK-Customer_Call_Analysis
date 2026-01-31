"""
Legacy Agent Runner - Simplified Version
Directly invokes Bedrock LLM with agent instructions as system prompts.
No ADK runtime dependency required.
"""
import sys
import os
import json
import logging
from typing import Dict, Any
import requests

# Add legacy_src to path for priority_scoring
LEGACY_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'legacy_src'))
if LEGACY_PATH not in sys.path:
    sys.path.insert(0, LEGACY_PATH)

logger = logging.getLogger(__name__)

# Load env
from dotenv import load_dotenv
load_dotenv()

# Get Bedrock config
BEARER_TOKEN = os.getenv("AWS_BEARER_TOKEN_BEDROCK", "")
AWS_REGION = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
MODEL_ID = "anthropic.claude-3-sonnet-20240229-v1:0"

# Agent Instructions
SENTIMENT_INSTRUCTION = """You are a Sentiment Analysis Agent. Analyze the emotional tone of customer call transcripts.
Return ONLY valid JSON:
{"sentiment_score": -0.75, "sentiment_label": "Negative", "confidence": 0.92}
Score range: -1.0 (very negative) to +1.0 (very positive)"""

ISSUE_INSTRUCTION = """You are an Issue Extraction Agent. Extract customer issues from the transcript.
Return ONLY valid JSON:
{"issues": [{"issue_id": "issue_1", "issue_text": "Description", "evidence_span": "Quote from transcript", "confidence": 0.95}]}"""

CLASSIFICATION_INSTRUCTION = """You are a Classification Agent. Categorize issues into: Product Quality, Technical Issues, Billing, Customer Support, Delivery.
Return ONLY valid JSON:
{"classified_issues": [{"issue_id": "issue_1", "category": "Billing", "proposed_severity": 4, "confidence": 0.90}]}
Severity: 1 (low) to 5 (critical)"""

INSIGHT_INSTRUCTION = """You are an Insight Agent. Generate supervisor-actionable QA insights.
Return ONLY valid JSON:
{"insights": "Summary", "recommended_actions": ["Action 1"], "business_impact": "Impact assessment"}"""


def call_bedrock(prompt: str, system: str) -> str:
    """Call Bedrock API with Bearer Token auth."""
    if not BEARER_TOKEN:
        logger.warning("No Bearer Token - using simulation")
        return None
    
    url = f"https://bedrock-runtime.{AWS_REGION}.amazonaws.com/model/{MODEL_ID}/invoke"
    headers = {
        "Authorization": f"Bearer {BEARER_TOKEN}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    payload = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1024,
        "temperature": 0.2,
        "system": system,
        "messages": [{"role": "user", "content": prompt}]
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        if response.status_code == 200:
            result = response.json()
            return result["content"][0]["text"]
        else:
            logger.error(f"Bedrock error {response.status_code}: {response.text[:200]}")
            return None
    except Exception as e:
        logger.error(f"Bedrock call failed: {e}")
        return None


def parse_json(text: str) -> Dict[str, Any]:
    """Parse JSON from LLM response."""
    if not text:
        return {}
    try:
        text = text.replace("```json", "").replace("```", "").strip()
        start = text.find("{")
        end = text.rfind("}") + 1
        if start != -1 and end > start:
            return json.loads(text[start:end])
    except Exception as e:
        logger.error(f"JSON parse error: {e}")
    return {}


def simulate_agent(agent_type: str, prompt: str) -> Dict[str, Any]:
    """Deterministic simulation when Bedrock is unavailable."""
    prompt_lower = prompt.lower()
    
    if agent_type == "sentiment":
        neg_words = ["angry", "frustrated", "dissatisfied", "problem", "issue", "complaint", "wrong", "damaged", "hate", "terrible"]
        pos_words = ["thank", "resolved", "happy", "great", "excellent", "appreciate", "good", "helped"]
        neg = sum(1 for w in neg_words if w in prompt_lower)
        pos = sum(1 for w in pos_words if w in prompt_lower)
        
        if neg > pos:
            return {"sentiment_score": -0.65, "sentiment_label": "Negative", "confidence": 0.85}
        elif pos > neg:
            return {"sentiment_score": 0.55, "sentiment_label": "Positive", "confidence": 0.80}
        return {"sentiment_score": 0.1, "sentiment_label": "Neutral", "confidence": 0.75}
    
    elif agent_type == "issues":
        return {"issues": [{"issue_id": "issue_1", "issue_text": "Customer reported concern", "evidence_span": "from transcript", "confidence": 0.85}]}
    
    elif agent_type == "classification":
        return {"classified_issues": [{"issue_id": "issue_1", "category": "Customer Support", "proposed_severity": 3, "confidence": 0.82}]}
    
    elif agent_type == "insight":
        return {"insights": "Agent handled the call professionally.", "recommended_actions": ["Follow up within 24 hours"], "business_impact": "Standard interaction"}
    
    return {}


def calculate_priority(final_severity: int, sentiment_score: float) -> Dict[str, Any]:
    """Calculate priority from severity and sentiment."""
    severity_norm = final_severity / 5.0
    sentiment_risk = (1.0 - sentiment_score) / 2.0  # Convert -1 to 1 range to 0-1 risk
    priority_score = (0.6 * severity_norm) + (0.4 * sentiment_risk)
    priority_score = max(0.0, min(1.0, priority_score))
    
    if priority_score >= 0.75:
        level = "P0"
    elif priority_score >= 0.55:
        level = "P1"
    elif priority_score >= 0.35:
        level = "P2"
    else:
        level = "P3"
    
    return {"priority_score": round(priority_score, 2), "priority_level": level}


class LegacyOrchestrator:
    async def run_pipeline(self, transcript: str) -> Dict[str, Any]:
        """Run the multi-agent analysis pipeline."""
        results = {}
        
        # 1. Sentiment Analysis
        logger.info("Running Sentiment Agent...")
        resp = call_bedrock(f"Analyze this transcript:\n{transcript}", SENTIMENT_INSTRUCTION)
        results["sentiment"] = parse_json(resp) if resp else simulate_agent("sentiment", transcript)
        
        # 2. Issue Extraction
        logger.info("Running Issue Extraction Agent...")
        resp = call_bedrock(f"Extract issues from:\n{transcript}", ISSUE_INSTRUCTION)
        issues_data = parse_json(resp) if resp else simulate_agent("issues", transcript)
        results["issues"] = issues_data.get("issues", [])
        
        # 3. Classification
        logger.info("Running Classification Agent...")
        class_prompt = f"Transcript: {transcript}\n\nIssues: {json.dumps(results['issues'])}"
        resp = call_bedrock(class_prompt, CLASSIFICATION_INSTRUCTION)
        class_data = parse_json(resp) if resp else simulate_agent("classification", transcript)
        results["classified_issues"] = class_data.get("classified_issues", [])
        
        # 4. Priority Scoring
        max_severity = max([i.get("proposed_severity", 1) for i in results["classified_issues"]], default=1)
        sent_score = results["sentiment"].get("sentiment_score", 0)
        results["priority"] = calculate_priority(max_severity, sent_score)
        
        # 5. Insights
        logger.info("Running Insight Agent...")
        insight_prompt = f"Issues: {json.dumps(results['classified_issues'])}\nPriority: {results['priority']['priority_level']}"
        resp = call_bedrock(insight_prompt, INSIGHT_INSTRUCTION)
        results["insights"] = parse_json(resp) if resp else simulate_agent("insight", transcript)
        
        return self._format_output(results)
    
    def _format_output(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Format for frontend consumption."""
        sent = raw.get("sentiment", {})
        raw_score = sent.get("sentiment_score", 0)
        normalized_score = int((raw_score + 1) * 50)  # -1 to 1 -> 0 to 100
        
        trajectory = [
            {"phase": "Opening", "score": max(10, normalized_score - 15), "label": "Start"},
            {"phase": "Middle", "score": normalized_score, "label": sent.get("sentiment_label", "Neutral")},
            {"phase": "Closing", "score": min(100, normalized_score + 10), "label": "End"}
        ]
        
        checklist = []
        for issue in raw.get("classified_issues", []):
            sev = issue.get("proposed_severity", 3)
            checklist.append({
                "step": f"{issue.get('category', 'General')} Handling",
                "status": "pass" if sev <= 3 else "fail",
                "evidence": f"Severity {sev} - {issue.get('category', 'General')}"
            })
        if not checklist:
            checklist = [{"step": "General Procedure", "status": "pass", "evidence": "Standard handling"}]
        
        passed = sum(1 for c in checklist if c["status"] == "pass")
        compliance = int((passed / len(checklist)) * 100)
        
        priority = raw.get("priority", {})
        risk_detected = priority.get("priority_level") in ["P0", "P1"]
        
        insights = raw.get("insights", {})
        
        return {
            "summary": {
                "sentiment_score": normalized_score,
                "sop_score": compliance,
                "risk_severity": priority.get("priority_level", "P3").lower()
            },
            "sentiment": {
                "score": normalized_score,
                "trajectory": trajectory,
                "label": sent.get("sentiment_label", "Neutral")
            },
            "sop_compliance": {
                "adherence_score": compliance,
                "checklist": checklist
            },
            "risk_analysis": {
                "risk_detected": risk_detected,
                "flags": [{"category": "Priority", "confidence": "high"}] if risk_detected else [],
                "summary": insights.get("business_impact", "No critical risks")
            },
            "insights": insights,
            "issues": raw.get("issues", []),
            "classified_issues": raw.get("classified_issues", []),
            "priority": priority
        }


legacy_orchestrator = LegacyOrchestrator()
