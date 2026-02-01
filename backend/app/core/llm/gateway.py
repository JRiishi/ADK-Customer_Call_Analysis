import boto3
import json
import logging
import asyncio
import os
from typing import Optional
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("BEDROCK_GATEWAY")


class LLMGateway:
    """
    AWS Bedrock LLM Gateway - Real API calls only, no fallbacks.
    Optimized for efficiency with connection reuse and proper error handling.
    """
    
    def __init__(self):
        logger.info("=" * 60)
        logger.info("🚀 BEDROCK LLM GATEWAY - INITIALIZING (REAL MODE)")
        logger.info("=" * 60)
        
        self.region = os.environ.get("AWS_DEFAULT_REGION") or settings.AWS_REGION
        self.model_id = os.environ.get("BEDROCK_MODEL_ID") or settings.BEDROCK_MODEL_ID
        self.bedrock_client = None
        
        logger.info(f"📍 Region: {self.region}")
        logger.info(f"🤖 Model: {self.model_id}")
        
        # Initialize Bedrock client with proper credentials
        self._init_bedrock_client()
        
        logger.info("=" * 60)

    def _init_bedrock_client(self):
        """Initialize Bedrock client with available credentials."""
        try:
            # Check for environment credentials first (ECS task role injects these)
            if os.environ.get("AWS_ACCESS_KEY_ID"):
                self.bedrock_client = boto3.client(
                    'bedrock-runtime',
                    region_name=self.region
                )
                logger.info("🔑 Auth: Environment/Task Role credentials")
                logger.info("✅ Bedrock client initialized")
                return
            
            # Check for settings-based credentials
            if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
                self.bedrock_client = boto3.client(
                    'bedrock-runtime',
                    region_name=self.region,
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
                )
                logger.info("🔑 Auth: Settings-based IAM credentials")
                logger.info("✅ Bedrock client initialized")
                return
            
            # Try default credential chain (instance profile, etc.)
            self.bedrock_client = boto3.client('bedrock-runtime', region_name=self.region)
            logger.info("🔑 Auth: Default credential chain")
            logger.info("✅ Bedrock client initialized")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Bedrock client: {e}")
            raise RuntimeError(f"Cannot initialize Bedrock: {e}. Ensure AWS credentials are configured.")

    async def invoke_model(self, prompt: str, system_instruction: str = None) -> str:
        """
        Invoke Bedrock model with real API call.
        No fallbacks - raises exception on failure.
        """
        if not self.bedrock_client:
            raise RuntimeError("Bedrock client not initialized. Check AWS credentials.")
        
        logger.info("-" * 40)
        logger.info(f"📨 LLM Request | Prompt: {len(prompt)} chars")
        
        # Build payload for Claude
        payload = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "temperature": 0.2,  # Lower temp for more consistent structured output
            "messages": [{"role": "user", "content": prompt}]
        }
        
        if system_instruction:
            payload["system"] = system_instruction
            logger.info(f"📋 System instruction: {len(system_instruction)} chars")
        
        try:
            # Run in executor to avoid blocking
            loop = asyncio.get_running_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.bedrock_client.invoke_model(
                    modelId=self.model_id,
                    body=json.dumps(payload)
                )
            )
            
            # Parse response
            response_body = json.loads(response['body'].read())
            response_text = response_body['content'][0]['text']
            
            logger.info(f"✅ Response received: {len(response_text)} chars")
            
            return response_text
            
        except self.bedrock_client.exceptions.ThrottlingException as e:
            logger.warning(f"⏳ Throttled, retrying... {e}")
            # Wait and retry once
            await asyncio.sleep(2)
            return await self._retry_invoke(payload)
            
        except Exception as e:
            logger.error(f"❌ Bedrock invocation failed: {e}")
            raise RuntimeError(f"LLM invocation failed: {e}")

    async def _retry_invoke(self, payload: dict) -> str:
        """Single retry for throttled requests."""
        try:
            loop = asyncio.get_running_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.bedrock_client.invoke_model(
                    modelId=self.model_id,
                    body=json.dumps(payload)
                )
            )
            response_body = json.loads(response['body'].read())
            return response_body['content'][0]['text']
        except Exception as e:
            logger.error(f"❌ Retry failed: {e}")
            raise RuntimeError(f"LLM retry failed: {e}")


# Singleton instance
bedrock_gateway = LLMGateway()
