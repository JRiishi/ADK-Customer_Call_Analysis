#!/usr/bin/env python3
"""Test that all agents import successfully with Bedrock adapter."""

try:
    from issue_extraction.agent import root_agent
    from service_classification_agent.agent import service_classification_agent
    from knowledge_retrival.agent import knowledge_retrieval_agent
    from validation_agent.agent import severity_validation_agent
    from sentiment.sentiment_agent import sentiment_analysis_agent
    from insight_and_report_agent.agent import insight_report_agent
    from main_agent.agent import main_agent
    from llm_adapters.bedrock_llm import BedrockClaudeLLM

    print("✅ All agents import successfully!")
    print()
    print("Agents using BedrockClaudeLLM:")
    agents = [
        ("issue_extraction", root_agent),
        ("service_classification", service_classification_agent),
        ("knowledge_retrieval", knowledge_retrieval_agent),
        ("severity_validation", severity_validation_agent),
        ("sentiment_analysis", sentiment_analysis_agent),
        ("insight_report", insight_report_agent),
        ("main_orchestrator", main_agent),
    ]
    for name, agent in agents:
        print(f"  ✓ {name}: {agent.name}")

except Exception as e:
    print(f"❌ Import failed: {e}")
    import traceback
    traceback.print_exc()
