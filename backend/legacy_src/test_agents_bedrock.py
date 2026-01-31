#!/usr/bin/env python3
"""Test all agents with Bedrock backend."""

import asyncio
import json
import sys
from datetime import datetime

# Import all agents
from issue_extraction.agent import root_agent as issue_extraction_agent
from service_classification_agent.agent import service_classification_agent
from knowledge_retrival.agent import knowledge_retrieval_agent
from validation_agent.agent import severity_validation_agent
from sentiment.sentiment_agent import sentiment_analysis_agent
from insight_and_report_agent.agent import insight_report_agent
from main_agent.agent import main_agent

from output_validation_agent import OutputValidator
from priority_scoring import calculate_priority

# Sample test data
SAMPLE_TRANSCRIPT = """
Customer: Hi, I'm calling because I've had a terrible experience with your service.
My order arrived 5 days late, and when it finally came, the product was damaged.
I've been waiting for a replacement for 2 weeks now with no updates.
This is absolutely unacceptable.

Support: I understand your frustration. Let me look into this for you.
I sincerely apologize for the delay and the damaged product.
We should have provided better updates during this process.
"""


async def test_issue_extraction():
    """Test Issue Extraction Agent."""
    print("\n" + "="*60)
    print("🔍 Testing Issue Extraction Agent")
    print("="*60)
    
    try:
        print(f"Input: {SAMPLE_TRANSCRIPT[:100]}...")
        print("\nCalling agent...")
        
        # Create proper ADK invocation context
        from google.genai import types
        from google.adk.execution import ExecutionContext
        
        ctx = ExecutionContext()
        result_text = ""
        
        # run_async() requires a context, not just a string
        async for chunk in issue_extraction_agent.run_async(
            ctx, 
            message=SAMPLE_TRANSCRIPT
        ):
            result_text += str(chunk)
        
        print(f"\n✅ Issue Extraction Response:")
        print(f"Content: {result_text[:500]}")
        return True
        
    except Exception as e:
        print(f"\n❌ Issue Extraction failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def test_sentiment_analysis():
    """Test Sentiment Analysis Agent."""
    print("\n" + "="*60)
    print("😊 Testing Sentiment Analysis Agent")
    print("="*60)
    
    try:
        print(f"Input: {SAMPLE_TRANSCRIPT[:100]}...")
        print("\nCalling agent...")
        
        from google.adk.execution import ExecutionContext
        
        ctx = ExecutionContext()
        result_text = ""
        
        async for chunk in sentiment_analysis_agent.run_async(
            ctx,
            message=SAMPLE_TRANSCRIPT
        ):
            result_text += str(chunk)
        
        print(f"\n✅ Sentiment Analysis Response:")
        print(f"Content: {result_text[:500]}")
        return True
        
    except Exception as e:
        print(f"\n❌ Sentiment Analysis failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_priority_scoring():
    """Test Priority Scoring (deterministic)."""
    print("\n" + "="*60)
    print("📊 Testing Priority Scoring Module")
    print("="*60)
    
    try:
        # Test with high severity, negative sentiment
        result = calculate_priority(
            final_severity=4,
            severity_confidence=0.9,
            sentiment_score=-0.8,
            sentiment_confidence=0.85,
        )
        
        print(f"\nInput: severity=4, sentiment=-0.8")
        print(f"\n✅ Priority Result:")
        print(json.dumps(result, indent=2))
        return True
        
    except Exception as e:
        print(f"\n❌ Priority Scoring failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_output_validation():
    """Test Output Validator (deterministic)."""
    print("\n" + "="*60)
    print("✔️  Testing Output Validation Module")
    print("="*60)
    
    try:
        sample_output = {
            "system_status": {
                "state": "success",
                "failed_agents": [],
                "timestamp": datetime.now().isoformat(),
            },
            "issues": [
                {
                    "issue_id": "issue_1",
                    "issue_text": "Late delivery",
                    "evidence_span": "arrived 5 days late",
                    "confidence": 0.95,
                }
            ],
            "classified_issues": [
                {
                    "issue_id": "issue_1",
                    "issue_text": "Late delivery",
                    "category": "Delivery / Logistics",
                    "proposed_severity": 0.7,
                    "confidence": 0.85,
                }
            ],
            "validated_severity": [
                {
                    "issue_id": "issue_1",
                    "final_severity": 3,
                    "severity_label": "Medium",
                    "validated": True,
                    "confidence": 0.90,
                    "justification": "Service degradation with 5-day delay",
                    "grounding_source": "SOP-2024-001",
                }
            ],
            "sentiment": {
                "sentiment_score": -0.75,
                "sentiment_label": "Negative",
                "confidence": 0.92,
            },
            "priority": {
                "priority_score": 0.65,
                "priority_level": "P1",
                "confidence": 0.85,
            },
            "grounding_context": [
                {
                    "doc_id": "SOP-2024-001",
                    "version": "1.2",
                    "section": "§3.2",
                    "content": "Delivery SLA: 3 business days",
                    "related_issue_id": "issue_1",
                }
            ],
            "insights": "Critical delivery delays impacting customer satisfaction.",
            "recommended_actions": [
                "Review logistics partner performance",
                "Implement tracking notifications",
            ],
            "business_impact": "Risk of churn due to P1 delivery issues",
        }
        
        validator = OutputValidator()
        is_valid, errors, sanitized = validator.validate(sample_output)
        
        print(f"\nValidation Result: {'✅ VALID' if is_valid else '❌ INVALID'}")
        if errors:
            print(f"Errors: {errors}")
        else:
            print("No validation errors!")
        
        return is_valid
        
    except Exception as e:
        print(f"\n❌ Output Validation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all tests."""
    print("\n" + "="*60)
    print("🚀 BEDROCK AGENTS TEST SUITE")
    print("="*60)
    print(f"Timestamp: {datetime.now().isoformat()}")
    print(f"Agents: 7 (all using Bedrock Claude Sonnet)")
    
    results = {}
    
    # Test deterministic modules first (no API calls)
    print("\n\n📋 PHASE 1: Deterministic Modules (No API Calls)")
    results["Priority Scoring"] = test_priority_scoring()
    results["Output Validation"] = test_output_validation()
    
    # Test agents with Bedrock API
    print("\n\n🔌 PHASE 2: Agent Tests (With Bedrock API Calls)")
    results["Issue Extraction"] = await test_issue_extraction()
    results["Sentiment Analysis"] = await test_sentiment_analysis()
    
    # Summary
    print("\n\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    total_tests = len(results)
    passed_tests = sum(1 for v in results.values() if v)
    
    print(f"\nTotal: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total_tests - passed_tests} test(s) failed")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
