import boto3
from botocore.config import Config
import json
import os
from typing import AsyncGenerator, Any
import requests
import base64

from google.adk.models import BaseLlm, LlmRequest, LlmResponse
from google.genai import types

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv('main_agent/.env')


class BedrockClaudeLLM(BaseLlm):
    """
    ADK-compatible LLM backend using AWS Bedrock (Claude Sonnet).
    Supports Bedrock API Key (bearer token) authentication.
    
    Set AWS_BEARER_TOKEN_BEDROCK in main_agent/.env
    """

    model: str = "anthropic.claude-3-sonnet-20240229-v1:0"
    max_tokens: int = 2048
    temperature: float = 0.2
    region: str = "us-east-1"
    _client: Any = None
    _bearer_token: str = None
    _api_endpoint: str = None

    def model_post_init(self, __context: Any) -> None:
        """Initialize client after Pydantic model initialization."""
        self._bearer_token = os.getenv("AWS_BEARER_TOKEN_BEDROCK")
        self.region = os.getenv("AWS_DEFAULT_REGION", self.region)
        
        if self._bearer_token:
            # Decode the API key to get endpoint info
            # Bedrock API Keys are base64 encoded with format: BedrockAPIKey-XXXX-at-ACCOUNTID:SECRET
            self._api_endpoint = f"https://bedrock-runtime.{self.region}.amazonaws.com"
        else:
            # Fall back to standard AWS credentials
            self._client = boto3.client("bedrock-runtime", region_name=self.region)

    @classmethod
    def supported_models(cls) -> list[str]:
        """Returns supported Bedrock Claude models."""
        return [
            "anthropic.claude-3-sonnet-20240229",
            "anthropic.claude-3-haiku-20240307",
            "anthropic.claude-3-opus-20240229",
            "anthropic.claude-3-5-sonnet-20240620",
        ]

    async def generate_content_async(
        self, llm_request: LlmRequest, stream: bool = False
    ) -> AsyncGenerator[LlmResponse, None]:
        """
        Generate content using AWS Bedrock Claude.
        
        Args:
            llm_request: The LLM request from ADK
            stream: Whether to stream (not supported, will return single response)
            
        Yields:
            LlmResponse with the generated content
        """
        # Convert ADK request to Bedrock format
        messages = self._convert_request_to_messages(llm_request)
        
        # Build system prompt from llm_request if available
        system_prompt = ""
        if llm_request.config and llm_request.config.system_instruction:
            if isinstance(llm_request.config.system_instruction, str):
                system_prompt = llm_request.config.system_instruction
            elif hasattr(llm_request.config.system_instruction, 'parts'):
                system_prompt = " ".join(
                    part.text for part in llm_request.config.system_instruction.parts 
                    if hasattr(part, 'text') and part.text
                )
        
        # Debug disabled - uncomment to troubleshoot
        # print(f"[BEDROCK DEBUG] System prompt length: {len(system_prompt) if system_prompt else 0}")
        # print(f"[BEDROCK DEBUG] Messages: {messages}")

        payload = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "messages": messages,
        }
        
        if system_prompt:
            payload["system"] = system_prompt

        # Call Bedrock API
        try:
            if self._bearer_token:
                # Use Bedrock API Key (bearer token) authentication
                text_response = self._call_with_api_key(payload)
            else:
                # Use boto3 client with IAM credentials
                response = self._client.invoke_model(
                    modelId=self.model,
                    body=json.dumps(payload),
                )
                result = json.loads(response["body"].read())
                text_response = result["content"][0]["text"]
        except Exception as e:
            text_response = f"Error calling Bedrock: {str(e)}"

        # Convert to ADK LlmResponse format
        llm_response = LlmResponse(
            content=types.Content(
                role="model",
                parts=[types.Part(text=text_response)]
            ),
            partial=False
        )
        
        yield llm_response

    def _call_with_api_key(self, payload: dict) -> str:
        """Call Bedrock using API Key authentication."""
        url = f"{self._api_endpoint}/model/{self.model}/invoke"
        
        headers = {
            "Authorization": f"Bearer {self._bearer_token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        
        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=60,
        )
        
        if response.status_code != 200:
            raise Exception(f"Bedrock API error {response.status_code}: {response.text}")
        
        result = response.json()
        return result["content"][0]["text"]

    def _convert_request_to_messages(self, llm_request: LlmRequest) -> list[dict]:
        """Convert ADK LlmRequest contents to Bedrock message format."""
        messages = []
        
        for content in llm_request.contents:
            role = "user" if content.role == "user" else "assistant"
            
            # Extract text from parts
            text_parts = []
            for part in content.parts:
                if hasattr(part, 'text') and part.text:
                    text_parts.append(part.text)
                elif hasattr(part, 'function_call'):
                    # Handle function calls
                    fc = part.function_call
                    text_parts.append(f"[Function call: {fc.name}({fc.args})]")
                elif hasattr(part, 'function_response'):
                    # Handle function responses
                    fr = part.function_response
                    text_parts.append(f"[Function response: {fr.name} = {fr.response}]")
            
            if text_parts:
                messages.append({
                    "role": role,
                    "content": " ".join(text_parts)
                })
        
        # Ensure we have at least one message
        if not messages:
            messages.append({
                "role": "user",
                "content": "Please respond based on your instructions."
            })
        
        return messages

    def generate(self, prompt: str) -> str:
        """
        Simple synchronous generate method for direct usage.
        
        Args:
            prompt: The text prompt
            
        Returns:
            Generated text response
        """
        payload = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "messages": [{"role": "user", "content": prompt}],
        }

        try:
            if self._bearer_token:
                return self._call_with_api_key(payload)
            else:
                response = self._client.invoke_model(
                    modelId=self.model,
                    body=json.dumps(payload),
                )
                result = json.loads(response["body"].read())
                return result["content"][0]["text"]
        except Exception as e:
            return f"Error calling Bedrock: {str(e)}"
