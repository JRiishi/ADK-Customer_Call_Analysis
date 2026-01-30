#!/usr/bin/env python3
"""Direct test of ADK agent invocation with correct pattern."""

import asyncio
import os
import sys

# Load API key from .env
from dotenv import load_dotenv
load_dotenv('main_agent/.env')

from google.adk.agents.llm_agent import Agent
from google.adk.sessions import InMemorySessionService
from google.adk.runners import InvocationContext
from google.adk.plugins.plugin_manager import PluginManager
from google.adk.agents.run_config import RunConfig
from google.genai import types

async def call_agent(agent_path, input_text):
    """Call an ADK agent with proper invocation context."""
    # Import agent module
    agent_module_path = os.path.join(agent_path, 'agent.py')
    
    # Load agent from file
    import importlib.util
    spec = importlib.util.spec_from_file_location("agent_module", agent_module_path)
    agent_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(agent_module)
    
    # Try different agent variable names
    if hasattr(agent_module, 'root_agent'):
        agent = agent_module.root_agent
    elif hasattr(agent_module, 'service_classification_agent'):
        agent = agent_module.service_classification_agent
    elif hasattr(agent_module, 'insight_agent'):
        agent = agent_module.insight_agent
    else:
        # Get the first Agent object
        for attr_name in dir(agent_module):
            attr = getattr(agent_module, attr_name)
            if isinstance(attr, Agent):
                agent = attr
                break
    
    # Create session
    session_service = InMemorySessionService()
    session = session_service.create_session_sync(
        app_name="feedback_analysis",
        user_id="analyst"
    )
    
    # Create invocation context
    context = InvocationContext(
        agent=agent,
        session=session,
        session_service=session_service,
        user_content=types.Content(parts=[types.Part(text=input_text)]),
        invocation_id=f"inv_{id(agent)}",
        plugin_manager=PluginManager(),
        run_config=RunConfig()
    )
    
    # Run agent and collect output
    result = []
    async for event in agent.run_async(context):
        # Extract text from event.content.parts
        if hasattr(event, 'content') and event.content:
            if hasattr(event.content, 'parts') and event.content.parts:
                for part in event.content.parts:
                    if hasattr(part, 'text') and part.text:
                        result.append(part.text)
    
    return ''.join(result)


async def main():
    # Test input
    test_transcript = """
    I am extremely dissatisfied with my recent order. I am John Davis and I'm calling about 
    order number 123456. The FR-4401 refrigerator arrived yesterday and it's damaged. There 
    is a huge dent on the side and it's not cooling properly. I want to know what you're going 
    to do about this. I need a replacement and I want it delivered as soon as possible.
    """
    
    print("=" * 60)
    print("TESTING ADK AGENT INVOCATION")
    print("=" * 60)
    
    # Test Issue Extraction Agent
    print("\n[1/3] Issue Extraction Agent")
    print("-" * 60)
    issues_json = await call_agent("issue_extraction", test_transcript)
    print(f"✓ Full Response:\n{issues_json}\n")
    
    # Test Service Classification Agent
    print("\n[2/3] Service Classification Agent")
    print("-" * 60)
    classification_json = await call_agent("service_classification_agent", issues_json)
    print(f"✓ Full Response:\n{classification_json}\n")
    
    # Test Insight Agent
    print("\n[3/3] Insight & Report Agent")
    print("-" * 60)
    insights_json = await call_agent("insight_and_report_agent", classification_json)
    print(f"✓ Full Response:\n{insights_json}\n")
    
    print("\n" + "=" * 60)
    print("✓ ALL AGENTS WORKING")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
