from google.adk.agents.llm_agent import Agent
from text_recog import transcribe_audio   # function inside text_recog.py that returns transcript string

root_agent = Agent(
    model="gemini-2.5-flash",
    name="customer_feedback_agent",
    description="Agent that converts customer audio feedback into text, performs sentiment analysis, and generates service insights.",
    instruction="""
You are a customer feedback analysis agent.

Workflow:
1. When an audio file is provided, use the tool 'transcribe_audio' from text_recog.py to convert the audio into text.
2. Analyze the transcript and determine customer sentiment: Satisfied, Neutral, or Dissatisfied.
3. If Neutral or Dissatisfied, extract key complaints or reasons.
4. Classify the issues into service categories such as:
   - Response Time
   - Product Quality
   - Customer Support
   - Technical Issues
   - Billing / Pricing
   - Delivery / Logistics
5. Generate short business insights and actionable recommendations.

Always return the final output strictly in structured JSON with fields:
transcript, sentiment, confidence_score, issues, service_categories, insights, recommended_actions.
""",
    tools=[
        {
            "name": "transcribe_audio",
            "description": "Convert an audio file into text using text_recog.py",
            "function": transcribe_audio
        }
    ]
)
