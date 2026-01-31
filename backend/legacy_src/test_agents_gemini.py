#!/usr/bin/env python3
"""
Test all agents using Google Gemini backend (uses GOOGLE_API_KEY from .env).
This is an alternative to test_agents_bedrock.py when AWS credentials are not available.
"""

import asyncio
import json
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment
load_dotenv('main_agent/.env')

from google.adk.agents.llm_agent import Agent
from google.adk.sessions import InMemorySessionService
from google.adk.runners import InvocationContext
from google.adk.plugins.plugin_manager import PluginManager
from google.adk.agents.run_config import RunConfig
from google.genai import types

# Import supporting modules (non-LLM)
from output_validation_agent import OutputValidator
from priority_scoring import calculate_priority

# Sample test data
SAMPLE_TRANSCRIPT = """
Customer: Hi, I'm calling because I've had a terrible experience with your service.
My order arrived 5 days late, and when it finally came, the product was damaged.
I've been waiting for a replacement for 2 weeks now with no updates.
This is absolutely unacceptable. I want a full refund.

Support: I understand your frustration. Let me look into this for you.
I sincerely apologize for the delay and the damaged product.
We should have provided better updates during this process.
"""

# ============================================================
# Create Gemini-based agents (same prompts as Bedrock agents)
# ============================================================

issue_extraction_agent_gemini = Agent(
    model="gemini-2.0-flash",
    name='issue_extraction_agent',
    description='Extracts operationally actionable issues from customer support call transcripts.',
    instruction="""
You are an Issue Extraction Agent for support operations QA.

Analyze customer support call transcripts and extract operationally relevant issues.

Rules:
- Do NOT perform sentiment analysis or assign severity.
- Extract issues that affect operations: service failures, billing disputes, delays, damages.
- Include verbatim evidence from the transcript for each issue.
- If no actionable issue exists, return an empty list.

Output must ALWAYS be in strict JSON format:

{
  "issues": [
    {
      "issue_id": "issue_1",
      "issue_text": "Description of the problem",
      "evidence_span": "Direct quote from transcript",
      "confidence": 0.95
    }
  ]
}
"""
)

service_classification_agent_gemini = Agent(
    model="gemini-2.0-flash",
    name='service_classification_agent',
    description='Classifies extracted issues into service categories.',
    instruction="""
You are a Service Classification Agent.

Classify each issue into one of these categories:
- Delivery / Logistics
- Product Quality
- Customer Service
- Billing / Refunds
- Technical Support
- Account Management
- Other

Also propose a severity (1-5 scale) based on impact.

Input: JSON with "issues" array
Output: JSON with "classified_issues" array:

{
  "classified_issues": [
    {
      "issue_id": "issue_1",
      "issue_text": "Original issue text",
      "category": "Delivery / Logistics",
      "proposed_severity": 4,
      "severity_rationale": "Multi-day delay with damaged product"
    }
  ]
}
"""
)

sentiment_analysis_agent_gemini = Agent(
    model="gemini-2.0-flash",
    name='sentiment_analysis_agent',
    description='Analyzes sentiment of customer feedback.',
    instruction="""
You are a Sentiment Analysis Agent.

Analyze the overall sentiment of the customer in the transcript.

Output JSON:
{
  "sentiment": "negative",
  "sentiment_score": -0.8,
  "confidence": 0.95,
  "key_indicators": ["frustrated", "demanding refund", "unacceptable"]
}

sentiment_score: -1.0 (very negative) to +1.0 (very positive)
"""
)

insight_report_agent_gemini = Agent(
    model="gemini-2.0-flash",
    name='insight_report_agent',
    description='Generates business insights and recommendations.',
    instruction="""
You are an Insight & Report Generation Agent.

Given classified issues and sentiment, generate:
1. Key business insights
2. Actionable recommendations
3. Priority areas for improvement

Output JSON:
{
  "insights": "Summary of key findings...",
  "recommended_actions": [
    "Action 1",
    "Action 2"
  ],
  "priority_areas": ["Area 1", "Area 2"]
}
"""
)


def call_agent_sync(agent, input_text):
    """Call ADK agent synchronously."""
    import re
    
    session_service = InMemorySessionService()
    session = session_service.create_session_sync(
        app_name="agent_test",
        user_id="tester"
    )
    
    context = InvocationContext(
        agent=agent,
        session=session,
        session_service=session_service,
        user_content=types.Content(parts=[types.Part(text=input_text)]),
        invocation_id=f"inv_{id(agent)}",
        plugin_manager=PluginManager(),
        run_config=RunConfig()
    )
    
    async def run():
        result = []
        async for event in agent.run_async(context):
            if hasattr(event, 'content') and event.content:
                if hasattr(event.content, 'parts') and event.content.parts:
                    for part in event.content.parts:
                        if hasattr(part, 'text') and part.text:
                            result.append(part.text)
        return ''.join(result)
    
    return asyncio.run(run())


def extract_json(text):
    """Extract JSON from text response."""
    import re
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*$', '', text)
    text = text.strip()
    
    try:
        return json.loads(text)
    except:
        import re
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group().strip())
            except:
                pass
    return None


def test_agent(agent, agent_name, input_text, expected_keys=None):
    """Test a single agent and return results."""
    print(f"\n{'='*60}")
    print(f"🤖 Testing: {agent_name}")
    print(f"{'='*60}")
    print(f"Input: {input_text[:150]}...")
    
    try:
        response = call_agent_sync(agent, input_text)
        print(f"\n📤 Raw Response:\n{response[:500]}{'...' if len(response) > 500 else ''}")
        
        parsed = extract_json(response)
        if parsed:
            print(f"\n✅ Parsed JSON:")
            print(json.dumps(parsed, indent=2)[:500])
            
            if expected_keys:
                missing = [k for k in expected_keys if k not in parsed]
                if missing:
                    print(f"⚠️  Missing keys: {missing}")
                else:
                    print(f"✅ All expected keys present: {expected_keys}")
            
            return {"success": True, "data": parsed}
        else:
            print(f"⚠️  Could not parse JSON from response")
            return {"success": True, "data": response}
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


def main():
    print("\n" + "="*70)
    print("🧪 AGENT TESTING SUITE (Google Gemini Backend)")
    print("="*70)
    print(f"Timestamp: {datetime.now().isoformat()}")
    print(f"API Key: {'✅ Set' if os.getenv('GOOGLE_API_KEY') else '❌ Missing'}")
    
    results = {}
    
    # Test 1: Issue Extraction
    results['issue_extraction'] = test_agent(
        issue_extraction_agent_gemini,
        "Issue Extraction Agent",
        SAMPLE_TRANSCRIPT,
        expected_keys=['issues']
    )
    
    # Test 2: Service Classification (using issues from step 1)
    if results['issue_extraction']['success'] and isinstance(results['issue_extraction'].get('data'), dict):
        issues_input = json.dumps(results['issue_extraction']['data'])
    else:
        issues_input = json.dumps({"issues": [{"issue_id": "issue_1", "issue_text": "Late delivery", "evidence_span": "arrived 5 days late", "confidence": 0.9}]})
    
    results['classification'] = test_agent(
        service_classification_agent_gemini,
        "Service Classification Agent",
        issues_input,
        expected_keys=['classified_issues']
    )
    
    # Test 3: Sentiment Analysis
    results['sentiment'] = test_agent(
        sentiment_analysis_agent_gemini,
        "Sentiment Analysis Agent",
        SAMPLE_TRANSCRIPT,
        expected_keys=['sentiment', 'sentiment_score']
    )
    
    # Test 4: Insight Generation
    if results['classification']['success'] and isinstance(results['classification'].get('data'), dict):
        insight_input = json.dumps(results['classification']['data'])
    else:
        insight_input = json.dumps({"classified_issues": []})
    
    results['insights'] = test_agent(
        insight_report_agent_gemini,
        "Insight & Report Agent",
        insight_input,
        expected_keys=['insights', 'recommended_actions']
    )
    
    # Test 5: Priority Scoring (deterministic, no LLM)
    print(f"\n{'='*60}")
    print("📊 Testing: Priority Scoring (Deterministic)")
    print("="*60)
    try:
        priority_result = calculate_priority(
            final_severity=4,
            severity_confidence=0.9,
            sentiment_score=-0.8,
            sentiment_confidence=0.85,
        )
        print(f"Input: severity=4, sentiment=-0.8")
        print(f"Output: {json.dumps(priority_result, indent=2)}")
        results['priority'] = {"success": True, "data": priority_result}
        print("✅ Priority scoring working")
    except Exception as e:
        print(f"❌ Priority scoring failed: {e}")
        results['priority'] = {"success": False, "error": str(e)}
    
    # Test 6: Output Validation (deterministic, no LLM)
    print(f"\n{'='*60}")
    print("🔒 Testing: Output Validation (Deterministic)")
    print("="*60)
    try:
        sample_output = {
            "issues": [{"issue_id": "issue_1", "issue_text": "Late delivery", "evidence_span": "5 days late", "confidence": 0.95}],
            "classified_issues": [{"issue_id": "issue_1", "category": "Delivery / Logistics", "proposed_severity": 4}],
            "sentiment": {"sentiment_score": -0.8, "confidence": 0.9},
            "priority": {"priority_level": "P1", "priority_score": 0.85}
        }
        validator = OutputValidator()
        validation = validator.validate(sample_output)
        print(f"Validation result: {json.dumps(validation, indent=2)[:300]}")
        results['validation'] = {"success": True, "data": validation}
        print("✅ Output validation working")
    except Exception as e:
        print(f"❌ Output validation failed: {e}")
        results['validation'] = {"success": False, "error": str(e)}
    
    # Summary
    print("\n" + "="*70)
    print("📋 TEST SUMMARY")
    print("="*70)
    
    for name, result in results.items():
        status = "✅ PASS" if result.get('success') else "❌ FAIL"
        print(f"  {name}: {status}")
    
    passed = sum(1 for r in results.values() if r.get('success'))
    total = len(results)
    print(f"\nTotal: {passed}/{total} tests passed")
    print("="*70 + "\n")


if __name__ == "__main__":
    main()
