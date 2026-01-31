from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import certifi
import ssl

class Database:
    client: AsyncIOMotorClient = None
    db = None

    def connect(self):
        """Establish connection to MongoDB"""
        print(f"🔌 Connecting to MongoDB at {settings.MONGODB_URL}...")
        
        print(f"🔌 Connection String: {settings.MONGODB_URL}")
        
        # MongoDB Atlas connection with SSL using certifi CA bundle
        self.client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            tlsCAFile=certifi.where(),
            tls=True,
            tlsAllowInvalidCertificates=True,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000,
            socketTimeoutMS=30000
        )
        self.db = self.client[settings.DATABASE_NAME]
        print("✅ MongoDB Connection Established")

    def close(self):
        """Close connection"""
        if self.client:
            self.client.close()
            print("🔌 MongoDB Connection Closed")
    
    @property
    def buddy_pairs(self):
        """Access buddy_pairs collection"""
        return self.db.buddy_pairs
    
    @property
    def agent_profiles(self):
        """Access agent_profiles collection"""
        return self.db.agent_profiles

db = Database()

async def get_database():
    """Dependency to get DB instance"""
    if db.db is None:
        db.connect()
    return db.db
