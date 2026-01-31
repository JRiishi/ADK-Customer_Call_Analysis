from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import db
from app.api.v1.endpoints import live, analysis, sop, coaching
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("MAIN")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev, ideally restricted in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(live.router, prefix=f"{settings.API_V1_STR}/live", tags=["Live"])
app.include_router(analysis.router, prefix=f"{settings.API_V1_STR}/analysis", tags=["Analysis"])
app.include_router(sop.router, prefix=f"{settings.API_V1_STR}/sop", tags=["SOP"])
app.include_router(coaching.router, prefix=f"{settings.API_V1_STR}/coaching", tags=["Coaching"])

@app.on_event("startup")
async def startup_db():
    logger.info("=" * 70)
    logger.info("🚀 COGNIVISTA QA BACKEND - STARTING UP")
    logger.info("=" * 70)
    logger.info(f"📍 Project: {settings.PROJECT_NAME}")
    logger.info(f"📍 API Version: {settings.API_V1_STR}")
    logger.info(f"📍 MongoDB: {settings.MONGODB_URL}")
    logger.info(f"📍 Database: {settings.DATABASE_NAME}")
    logger.info("-" * 70)
    
    db.connect()
    try:
        # Ping the database to verify connection
        await db.client.admin.command('ping')
        logger.info("✅ MongoDB Connection Verified (Ping Successful)")
    except Exception as e:
        logger.error(f"❌ MongoDB Connection Failed: {e}")
    
    # Initialize the LLM Gateway (this will log its status)
    from app.core.llm.gateway import bedrock_gateway
    
    logger.info("=" * 70)
    logger.info("✅ BACKEND READY - Waiting for requests...")
    logger.info("=" * 70)

@app.on_event("shutdown")
async def shutdown_db():
    logger.info("🛑 Shutting down...")
    db.close()
    logger.info("👋 Goodbye!")

@app.get("/health")
async def health_check():
    logger.info("💓 Health check requested")
    return {"status": "ok", "service": "Cognivista Backend"}

@app.get("/")
async def root():
    return {
        "service": "Cognivista QA Backend",
        "status": "running",
        "api_docs": "/docs",
        "health": "/health"
    }
