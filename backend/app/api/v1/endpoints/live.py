from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.live_service import manager, nudge_engine
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
    datefmt='%H:%M:%S'
)
router = APIRouter()
logger = logging.getLogger("LIVE_API")

@router.websocket("/ws/{call_id}/{agent_id}")
async def websocket_endpoint(websocket: WebSocket, call_id: str, agent_id: str):
    """WebSocket endpoint for real-time call assistance"""
    logger.info(f"🔗 [WS] Connection request: call={call_id}, agent={agent_id}")
    
    await manager.connect(websocket, call_id)
    logger.info(f"✅ [WS] Connected: call={call_id}")
    
    try:
        while True:
            data = await websocket.receive_json()
            logger.debug(f"📨 [WS] Received: {data}")
            
            # Handle incoming client messages
            if data.get("type") == "transcript_update":
                transcript_text = data.get("text", "")
                role = data.get("role", "unknown")
                logger.info(f"📝 [WS] Transcript update from {role}: {transcript_text[:50]}...")
                
                # Send to Nudge Engine for real-time analysis
                await nudge_engine.process_transcript(call_id, transcript_text)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, call_id)
        logger.info(f"🔌 [WS] Client disconnected: agent={agent_id}, call={call_id}")
    except Exception as e:
        logger.error(f"❌ [WS] Error: {e}")
        manager.disconnect(websocket, call_id)
