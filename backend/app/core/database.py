from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

class Database:
    client: AsyncIOMotorClient = None
    db = None

    def connect(self):
        """Establish connection to MongoDB"""
        print(f"🔌 Connecting to MongoDB at {settings.MONGODB_URL}...")
        self.client = AsyncIOMotorClient(settings.MONGODB_URL)
        self.db = self.client[settings.DATABASE_NAME]
        print("✅ MongoDB Connection Established")

    def close(self):
        """Close connection"""
        if self.client:
            self.client.close()
            print("🔌 MongoDB Connection Closed")

db = Database()

async def get_database():
    """Dependency to get DB instance"""
    if db.db is None:
        db.connect()
    return db.db
