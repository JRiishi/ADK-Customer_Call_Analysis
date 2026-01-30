"""
PERFECT WORKING FUNCTION FOR ADK AGENT INVOCATION
================================================

This function correctly invokes Google ADK agents with proper InvocationContext.
Copy this function into your code to call any ADK agent.
"""

import asyncio
from google.adk.sessions import InMemorySessionService
from google.adk.runners import InvocationContext
from google.adk.plugins.plugin_manager import PluginManager
from google.adk.agents.run_config import RunConfig
from google.genai import types


def call_adk_agent(agent, user_input):
    """
    PERFECT WORKING FUNCTION to call an ADK agent synchronously.
    
    Args:
        agent: The ADK Agent instance
        user_input: Text string to send to the agent
        
    Returns:
        String response from the agent
    """
    
    async def run_agent_async():
        # Create session
        session_service = InMemorySessionService()
        session = session_service.create_session_sync(
            app_name="feedback_analysis",
            user_id="analyst"
        )
        
        # Create invocation context with ALL required fields
        context = InvocationContext(
            agent=agent,
            session=session,
            session_service=session_service,
            user_content=types.Content(parts=[types.Part(text=user_input)]),
            invocation_id=f"inv_{id(agent)}",
            plugin_manager=PluginManager(),
            run_config=RunConfig()  # THIS IS CRITICAL - don't forget it!
        )
        
        # Run agent and collect ALL output
        result = []
        async for event in agent.run_async(context):
            # Extract text from event.content.parts
            if hasattr(event, 'content') and event.content:
                if hasattr(event.content, 'parts') and event.content.parts:
                    for part in event.content.parts:
                        if hasattr(part, 'text') and part.text:
                            result.append(part.text)
        
        return ''.join(result)
    
    # Run the async function synchronously
    return asyncio.run(run_agent_async())


# EXAMPLE USAGE:
if __name__ == "__main__":
    # Make sure to load environment variables first!
    from dotenv import load_dotenv
    load_dotenv('main_agent/.env')
    
    # Import your agent
    from issue_extraction.agent import root_agent
    
    # Call it!
    test_input = "The product is broken and customer service was rude."
    response = call_adk_agent(root_agent, test_input)
    print("Agent response:")
    print(response)
