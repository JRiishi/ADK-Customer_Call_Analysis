import asyncio
from typing import Callable, Dict, List, Any
from pydantic import BaseModel

class Event(BaseModel):
    channel: str
    sender: str
    payload: Dict[str, Any]

class EventBus:
    _subscribers: Dict[str, List[Callable[[Event], Any]]] = {}

    @classmethod
    def subscribe(cls, channel: str, callback: Callable[[Event], Any]):
        if channel not in cls._subscribers:
            cls._subscribers[channel] = []
        cls._subscribers[channel].append(callback)
        print(f"📡 Subscribed to '{channel}'")

    @classmethod
    async def publish(cls, channel: str, sender: str, payload: Dict[str, Any]):
        event = Event(channel=channel, sender=sender, payload=payload)
        if channel in cls._subscribers:
            # Broadcast to all subscribers
            # In a real system, might want to run these concurrently or in background
            for callback in cls._subscribers[channel]:
                try:
                    if asyncio.iscoroutinefunction(callback):
                        await callback(event)
                    else:
                        callback(event)
                except Exception as e:
                    print(f"❌ Error in event handler for '{channel}': {e}")
        else:
            # print(f"⚠️ No subscribers for '{channel}'")
            pass

global_bus = EventBus()
