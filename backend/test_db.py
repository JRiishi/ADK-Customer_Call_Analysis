import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Load env directly to bypass Pydantic for this test
load_dotenv()

async def test_connection():
    uri = os.getenv("MONGODB_URL")
    print(f"🔌 Testing connection to: {uri[:20]}...") 
    
    if not uri:
        print("❌ MONGODB_URL not found in environment!")
        return

    try:
        client = AsyncIOMotorClient(uri)
        # Force a network call
        info = await client.server_info()
        print(f"✅ Successfully connected to MongoDB version: {info.get('version')}")
        
        # Test write
        db = client.get_default_database()
        res = await db["connection_test"].insert_one({"status": "working"})
        print(f"✅ Write test successful. Doc ID: {res.inserted_id}")
        
    except Exception as e:
        print(f"❌ Connection Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())
