from google.adk.agents.llm_agent import Agent
from llm_adapters.bedrock_llm import BedrockClaudeLLM

bedrock_model = BedrockClaudeLLM()

root_agent = Agent(
    model=bedrock_model,
    name='issue_extraction_agent',
    description='Extracts operationally actionable issues from customer support call transcripts with evidence tracking.',
    instruction="""You are an Issue Extraction Agent. Your task is to extract customer complaints and problems from the transcript provided by the user.

IMPORTANT: The user's message IS the transcript. Extract ALL issues/complaints/problems mentioned.

Extract these types of issues:
- Service delays or slow response
- Product quality problems (battery charge, defects)
- App/system errors or inaccuracies
- Staff behavior issues
- Billing or pricing problems
- Long wait times

Output ONLY valid JSON in this exact format:
{
  "issues": [
    {
      "issue_id": "issue_1",
      "issue_text": "Brief description of the problem",
      "evidence_span": "Exact quote from the transcript",
      "confidence": 0.9
    }
  ]
}

If no issues found, return: {"issues": []}

Now analyze the transcript and extract all issues:"""
)
