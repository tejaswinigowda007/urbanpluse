import os
import sys
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Add app and ml root to path
current_dir = os.path.dirname(os.path.abspath(__file__))
ml_dir = os.path.abspath(os.path.join(current_dir, "..", "..", "ml"))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
if ml_dir not in sys.path:
    sys.path.insert(0, ml_dir)

from database.connection import init_database, get_db
from auth.jwt import get_password_hash
from routes.auth import router as auth_router
from routes.reports import router as reports_router
from routes.predict import router as predict_router
from routes.analytics import router as analytics_router
from routes.alerts import router as alerts_router
from routes.ml_performance import router as ml_performance_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("UrbanPulse")

async def seed_initial_demo_accounts(db):
    demo_accounts = [
        {
            "id": "USR-DEMO-CITIZEN",
            "name": "Arjun Sharma (Citizen)",
            "email": "citizen@urbanpulse.demo",
            "password_hash": get_password_hash("DemoPass123!"),
            "role": "CITIZEN",
            "created_at": "2026-01-01T00:00:00"
        },
        {
            "id": "USR-DEMO-AUTHORITY",
            "name": "Dr. Ramesh Rao (Smart City Commissioner)",
            "email": "authority@urbanpulse.demo",
            "password_hash": get_password_hash("DemoPass123!"),
            "role": "AUTHORITY",
            "created_at": "2026-01-01T00:00:00"
        }
    ]
    for account in demo_accounts:
        existing = await db.get_user_by_email(account["email"])
        if not existing:
            await db.create_user(account)
            logger.info(f"Seeded demo account: {account['email']} ({account['role']})")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing UrbanPulse backend services...")
    db = await init_database()
    await seed_initial_demo_accounts(db)
    yield

app = FastAPI(
    title="UrbanPulse — AI Micro-Issue & Escalation Predictor API",
    description="Smart City backend service providing AI-driven micro-issue detection, escalation forecasting, priority assignment, and trend intelligence.",
    version="1.0.0-prototype",
    lifespan=lifespan
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for issue images
uploads_dir = os.path.join(os.path.dirname(current_dir), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Register API Routers
app.include_router(auth_router)
app.include_router(reports_router)
app.include_router(predict_router)
app.include_router(analytics_router)
app.include_router(alerts_router)
app.include_router(ml_performance_router)

@app.get("/")
async def root():
    return {
        "project": "UrbanPulse",
        "tagline": "AI-Based Micro-Issue Trend and Escalation Predictor for Urban Systems",
        "status": "online",
        "api_docs": "/docs",
        "version": "1.0.0-prototype"
    }

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "UrbanPulse Core API"}