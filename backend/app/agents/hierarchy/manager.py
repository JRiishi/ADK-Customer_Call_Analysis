from app.core.bus import global_bus, Event
import asyncio

class ManagerAgent:
    def __init__(self, manager_id: str):
        self.manager_id = manager_id
        self.worker_stats = {} # {worker_id: {calls: 0, avg_sentiment: 0}}
    
    async def start(self):
        # Subscribe to worker updates
        global_bus.subscribe("agent_updates", self.handle_worker_update)
        print(f"👔 Manager {self.manager_id} reporting for duty.")

    async def handle_worker_update(self, event: Event):
        worker_id = event.sender
        data = event.payload
        
        print(f"👔 Manager received update from {worker_id}: {data.get('type')}")
        
        # Track stats
        if worker_id not in self.worker_stats:
            self.worker_stats[worker_id] = {"calls": 0, "sentiment_acc": 0}
        
        stats = self.worker_stats[worker_id]
        stats["calls"] += 1
        
        # Simple Logic: If sentiment is negative, trigger coaching
        results = data.get("results", {})
        sentiment = results.get("sentiment", {}).get("score", 0)
        
        if sentiment < -0.3:
            await self.send_coaching(worker_id, "Detected negative sentiment. Try to empathize more.")
            
        # Report up to Supervisor
        await global_bus.publish(
            channel="manager_reports",
            sender=self.manager_id,
            payload={
                "worker_id": worker_id,
                "status": "needs_help" if sentiment < -0.3 else "performing_well"
            }
        )

    async def send_coaching(self, worker_id: str, advice: str):
        # in a real system this might go to a specific channel per worker
        # or call a method on the worker instance if locally available
        print(f"📢 Manager -> {worker_id}: {advice}")
        # For simulation, we just publish it back to a generic coaching channel
        await global_bus.publish(
            channel="coaching_directives",
            sender=self.manager_id,
            payload={"target": worker_id, "advice": advice}
        )
