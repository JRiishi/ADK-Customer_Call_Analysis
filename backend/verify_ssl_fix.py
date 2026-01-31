import ssl
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
import sys

# Add project root to path
sys.path.append(os.getcwd())

from app.core.config import settings

async def main():
    print(f"🔌 Connection String: {settings.MONGODB_URL}")
    print(f"🛡️  Certifi Path: {certifi.where()}")
    
    # Configuration to test
    client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        tlsCAFile=certifi.where(),
        tls=True,
        tlsAllowInvalidCertificates=True,
        serverSelectionTimeoutMS=5000
    )
    
    try:
        print("Ping...")
        await client.admin.command('ping')
        print("✅ SUCCESS: Connected to MongoDB!")
    except Exception as e:
        print(f"❌ FAILURE: {e}")

if __name__ == "__main__":
    asyncio.run(main())
