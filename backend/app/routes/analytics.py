from fastapi import APIRouter, Depends
from models.schemas import TrendAnalyticsResponse, KPISummary
from services.trend_service import TrendService
from database.connection import get_db
from database.interface import DatabaseAdapter

router = APIRouter(prefix="/api/analytics", tags=["Trend Intelligence & Analytics"])

@router.get("/trends", response_model=TrendAnalyticsResponse)
async def get_trends(db: DatabaseAdapter = Depends(get_db)):
    trends = await TrendService.get_comprehensive_trends(db)
    return TrendAnalyticsResponse(**trends)

@router.get("/kpis", response_model=KPISummary)
async def get_kpis(db: DatabaseAdapter = Depends(get_db)):
    trends = await TrendService.get_comprehensive_trends(db)
    return KPISummary(**trends["kpis"])
