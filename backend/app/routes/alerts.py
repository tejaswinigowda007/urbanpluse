from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from models.schemas import AlertResponse
from services.alert_service import AlertService
from auth.dependencies import require_authority
from database.connection import get_db
from database.interface import DatabaseAdapter

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertResponse])
async def list_alerts(
    is_read: Optional[bool] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    db: DatabaseAdapter = Depends(get_db)
):
    alerts = await AlertService.get_alerts(db, is_read=is_read, limit=limit)
    return [AlertResponse(**a) for a in alerts]

@router.patch("/{alert_id}/read")
async def mark_alert_as_read(
    alert_id: str,
    current_user: dict = Depends(require_authority),
    db: DatabaseAdapter = Depends(get_db)
):
    success = await AlertService.mark_read(db, alert_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    return {"message": "Alert marked as read", "alert_id": alert_id}

@router.post("/read-all")
async def mark_all_alerts_as_read(
    current_user: dict = Depends(require_authority),
    db: DatabaseAdapter = Depends(get_db)
):
    count = await AlertService.mark_all_read(db)
    return {"message": f"{count} alerts marked as read"}
