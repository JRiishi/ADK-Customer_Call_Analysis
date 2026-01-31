import json
import logging
from typing import Dict, Any, Optional
from app.core.llm.gateway import bedrock_gateway

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("AGENT_BASE")

class BaseAgent:
    def __init__(self, name: str, role: str):
        self.name = name
        self.role = role
        logger.info(f"🤖 Agent initialized: {name}")

    async def _invoke_llm(self, prompt: str, system_instruction: str = None) -> Dict[str, Any]:
        """
        Wraps Bedrock Gateway with JSON parsing, validation, and comprehensive logging.
        """
        logger.info(f"{'='*60}")
        logger.info(f"🔄 [{self.name}] Starting LLM invocation")
        logger.info(f"📝 [{self.name}] Prompt length: {len(prompt)} chars")
        
        try:
            full_system_prompt = f"{self.role}\n{system_instruction or ''}\n\nYou are running as: {self.name}\n\nIMPORTANT: Always respond with valid JSON only. No markdown, no explanations outside JSON."
            
            logger.info(f"📡 [{self.name}] Calling Bedrock Gateway...")
            response_text = await bedrock_gateway.invoke_model(prompt, system_instruction=full_system_prompt)
            
            logger.info(f"📥 [{self.name}] Raw response: {len(response_text)} chars")
            logger.debug(f"📥 [{self.name}] Response preview: {response_text[:300]}...")
            
            # Clean and parse JSON
            clean_text = response_text.replace("```json", "").replace("```", "").strip()
            
            # Find JSON boundaries
            start = clean_text.find("{")
            end = clean_text.rfind("}") + 1
            
            if start != -1 and end > start:
                clean_text = clean_text[start:end]
                result = json.loads(clean_text)
                logger.info(f"✅ [{self.name}] JSON parsed successfully")
                logger.info(f"📊 [{self.name}] Result keys: {list(result.keys())}")
                return result
            else:
                logger.error(f"❌ [{self.name}] No JSON object found in response")
                return {"error": "No JSON found", "raw": response_text[:500]}
                
        except json.JSONDecodeError as e:
            logger.error(f"❌ [{self.name}] JSON parse error: {e}")
            logger.error(f"❌ [{self.name}] Failed text: {response_text[:500] if response_text else 'empty'}")
            return {"error": f"Invalid JSON: {str(e)}", "raw": response_text[:500] if response_text else ""}
            
        except Exception as e:
            logger.error(f"❌ [{self.name}] Execution failed: {e}")
            import traceback
            logger.error(f"❌ [{self.name}] Traceback: {traceback.format_exc()}")
            return {"error": str(e)}

    async def run(self, input_data: Any) -> Dict[str, Any]:
        raise NotImplementedError("Subclasses must implement run()")
