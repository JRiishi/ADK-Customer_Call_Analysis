from app.core.bus import global_bus, Event

class SupervisorAgent:
    def __init__(self, supervisor_id: str):
        self.id = supervisor_id
        self.alerts = []

    async def start(self):
        global_bus.subscribe("manager_reports", self.handle_manager_report)
        print(f"👑 Supervisor {self.id} watching over.")

    async def handle_manager_report(self, event: Event):
        data = event.payload
        if data.get("status") == "needs_help":
            print(f"🚨 Supervisor Alert: Worker {data.get('worker_id')} needs help!")
            self.alerts.append(data)
