import os
import uuid
import aiofiles
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from models.schemas import ReportCreate, ReportResponse, ReportStatusUpdate, StatusHistoryResponse
from auth.dependencies import get_current_user, require_authority
from database.connection import get_db
from database.interface import DatabaseAdapter
from services.report_service import ReportService

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    req: ReportCreate,
    current_user: dict = Depends(get_current_user),
    db: DatabaseAdapter = Depends(get_db)
):
    try:
        report_dict = req.dict()
        created = await ReportService.create_report(db, report_dict, current_user)
        return ReportResponse(**created)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit issue report: {str(e)}"
        )

@router.get("", response_model=List[ReportResponse])
async def list_reports(
    user_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: DatabaseAdapter = Depends(get_db)
):
    reports = await db.get_reports(
        user_id=user_id,
        category=category,
        status=status,
        priority=priority,
        limit=limit,
        offset=offset
    )
    return [ReportResponse(**r) for r in reports]

@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(report_id: str, db: DatabaseAdapter = Depends(get_db)):
    report = await db.get_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return ReportResponse(**report)

@router.patch("/{report_id}/status", response_model=ReportResponse)
async def update_status(
    report_id: str,
    update: ReportStatusUpdate,
    current_user: dict = Depends(require_authority),
    db: DatabaseAdapter = Depends(get_db)
):
    updated = await ReportService.update_status(
        db=db,
        report_id=report_id,
        new_status=update.status,
        user=current_user,
        notes=update.notes
    )
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return ReportResponse(**updated)

@router.get("/{report_id}/history", response_model=List[StatusHistoryResponse])
async def get_history(report_id: str, db: DatabaseAdapter = Depends(get_db)):
    history = await db.get_status_history_by_report(report_id)
    return [StatusHistoryResponse(**h) for h in history]

@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    
    file_ext = os.path.splitext(file.filename)[1].lower() or ".jpg"
    new_filename = f"img_{uuid.uuid4().hex[:12]}{file_ext}"
    target_path = os.path.join(uploads_dir, new_filename)
    
    try:
        async with aiofiles.open(target_path, "wb") as out_file:
            content = await file.read()
            await out_file.write(content)
            
        return {"image_url": f"/uploads/{new_filename}", "filename": new_filename}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(e)}"
        )
