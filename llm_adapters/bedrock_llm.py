import boto3
import json
import os
from typing import AsyncGenerator, Any

from google.adk.models import BaseLlm, LlmRequest, LlmResponse
from google.genai import types


class BedrockClaudeLLM(BaseLlm):
    """
    ADK-compatible LLM backend using AWS Bedrock (Claude Sonnet).
    Inherits from BaseLlm to integrate with Google ADK Agent framework.
    Authentication: Set AWS_BEARER_TOKEN_BEDROCK environment variable with your bearer token.
    """

    model: str = "anthropic.claude-3-sonnet-20240229"
    max_tokens: int = 2048
    temperature: float = 0.2
    region: str = "us-east-1"
    _client: Any = None

    def model_post_init(self, __context: Any) -> None:
        """Initialize boto3 client after Pydantic model initialization."""
        bearer_token = os.getenv("AWS_BEARER_TOKEN_BEDROCK")
        
        if bearer_token:
            # Use bearer token for authentication
            self._client = boto3.client(
                "bedrock-runtime",
                region_name=self.region,
                aws_access_key_id="",
                aws_secret_access_key="",
            )
            # Override with bearer token in headers (custom approach)
            self._bearer_token = bearer_token
        else:
            # Fall back to standard AWS credentials (aws configure)
            self._client = boto3.client("bedrock-runtime", region_name=self.region)
            self._bearer_token = None

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

        payload = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "messages": messages,
        }
        
        if system_prompt:
            payload["system"] = system_prompt

        # Call Bedrock API (synchronous, wrapped for async interface)
        try:
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

        if self._bearer_token:
            # Use bearer token authentication
            import requests
            headers = {
                "Authorization": f"Bearer {self._bearer_token}",
                "Content-Type": "application/json",
            }
            try:
                response = requests.post(
                    f"https://bedrock.{self.region}.amazonaws.com/model/{self.model}/invoke",
                    headers=headers,
                    json=payload,
                    timeout=30,
                )
                response.raise_for_status()
                result = response.json()
                return result["content"][0]["text"]
            except Exception as e:
                return f"Error calling Bedrock with bearer token: {str(e)}"
        else:
            # Use standard boto3 client
            response = self._client.invoke_model(
                modelId=self.model,
                body=json.dumps(payload),
            )
            result = json.loads(response["body"].read())
            return result["content"][0]["text"]
