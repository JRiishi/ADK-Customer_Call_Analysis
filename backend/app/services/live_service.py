from fastapi import WebSocket
from typing import Dict, List
import json
import logging
from app.core.llm.gateway import bedrock_gateway

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("LIVE_SERVICE")

class ConnectionManager:
    def __init__(self):
        # call_id -> List[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}
        logger.info("🔌 WebSocket Connection Manager initialized")

    async def connect(self, websocket: WebSocket, call_id: str):
        await websocket.accept()
        if call_id not in self.active_connections:
            self.active_connections[call_id] = []
        self.active_connections[call_id].append(websocket)
        logger.info(f"🔗 [WS] Client connected for call: {call_id} (Total: {len(self.active_connections[call_id])})")

    def disconnect(self, websocket: WebSocket, call_id: str):
        if call_id in self.active_connections:
            if websocket in self.active_connections[call_id]:
                self.active_connections[call_id].remove(websocket)
            if not self.active_connections[call_id]:
                del self.active_connections[call_id]
        logger.info(f"🔌 [WS] Client disconnected from call: {call_id}")

    async def broadcast_to_call(self, call_id: str, message: dict):
        if call_id in self.active_connections:
            logger.info(f"📢 [WS] Broadcasting to {len(self.active_connections[call_id])} client(s) on call {call_id}")
            for connection in self.active_connections[call_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"❌ [WS] Failed to send message: {e}")

manager = ConnectionManager()

class NudgeEngine:
    """Real-time nudge engine for live call assistance"""
    
    def __init__(self):
        logger.info("💡 Nudge Engine initialized")
    
    async def process_transcript(self, call_id: str, text: str):
        """
        Hybrid Nudge Logic:
        1. Instant Keyword Check (fast)
        2. LLM-based semantic analysis (for longer utterances)
        """
        logger.info(f"💡 [NUDGE] Processing text for call {call_id}: {text[:50]}...")
        
        lower_text = text.lower()
        
        # 1. Instant Keyword Detection - High Priority Triggers
        high_risk_keywords = {
            "cancel": ("Churn Risk", "Customer mentioned cancellation. Offer retention options!", "high"),
            "terminate": ("Churn Risk", "Customer wants to terminate. Use retention SOP!", "high"),
            "lawyer": ("Legal Risk", "⚠️ Legal mention detected. Transfer to supervisor!", "critical"),
            "sue": ("Legal Risk", "⚠️ Legal threat detected. Escalate immediately!", "critical"),
            "lawsuit": ("Legal Risk", "⚠️ Lawsuit mentioned. Supervisor needed!", "critical"),
            "terrible": ("Sentiment Alert", "High frustration detected. Show empathy first.", "medium"),
            "worst": ("Sentiment Alert", "Negative sentiment spike. Acknowledge feelings.", "medium"),
            "ridiculous": ("Sentiment Alert", "Customer frustrated. Slow down and listen.", "medium"),
        }
        
        for keyword, (category, message, severity) in high_risk_keywords.items():
            if keyword in lower_text:
                logger.info(f"🚨 [NUDGE] Keyword trigger: '{keyword}' -> {category}")
                nudge = {
                    "type": "nudge",
                    "category": category,
                    "severity": severity,
                    "message": message,
                    "trigger": keyword,
                    "timestamp": "now"
                }
                await manager.broadcast_to_call(call_id, nudge)
                return

        # 2. LLM-based Analysis for longer utterances
        if len(text.split()) > 8:
            logger.info(f"🧠 [NUDGE] Running LLM analysis for semantic nudge...")
            
            prompt = f"""
Analyze this live call snippet for immediate coaching needs.

Customer/Agent said: "{text}"

Determine if the agent needs an immediate coaching nudge. Consider:
- Customer showing frustration that needs acknowledgment
- Agent missing empathy cues
- Opportunity to offer a solution
- Risk indicators

Respond with ONLY this JSON:
{{
    "nudge_needed": <true|false>,
    "message": "<short coaching tip if needed, or empty string>",
    "severity": "<low|medium|high>"
}}
"""
            try:
                response_txt = await bedrock_gateway.invoke_model(prompt)
                
                # Parse response
                response_txt = response_txt.replace("```json", "").replace("```", "").strip()
                start = response_txt.find("{")
                end = response_txt.rfind("}") + 1
                
                if start != -1 and end > start:
                    data = json.loads(response_txt[start:end])
                    
                    if data.get("nudge_needed"):
                        logger.info(f"💡 [NUDGE] LLM nudge generated: {data.get('message', '')[:50]}")
                        nudge = {
                            "type": "nudge",
                            "category": "AI Coaching",
                            "severity": data.get("severity", "low"),
                            "message": data.get("message", "Consider your response carefully."),
                        }
                        await manager.broadcast_to_call(call_id, nudge)
                    else:
                        logger.debug(f"💡 [NUDGE] No nudge needed for this utterance")
                        
            except Exception as e:
                logger.error(f"❌ [NUDGE] LLM analysis error: {e}")

nudge_engine = NudgeEngine()
