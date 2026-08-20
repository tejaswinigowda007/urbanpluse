import uuid
import datetime
from typing import Dict, Any, List, Optional
from database.interface import DatabaseAdapter
from services.ml_service import extract_features_from_report, run_ml_prediction

class ReportService:
    @staticmethod
    async def create_report(
        db: DatabaseAdapter,
        report_data: dict,
        user: dict
    ) -> dict:
        report_id = f"REP-{uuid.uuid4().hex[:8].upper()}"
        now_str = datetime.datetime.utcnow().isoformat()
        
        # 1. Fetch existing reports to calculate real neighborhood spatial features
        all_existing = await db.get_reports(limit=500)
        
        # 2. Extract ML features
        features = extract_features_from_report(report_data, all_existing)
        
        # 3. Run genuine trained Random Forest model
        prediction_result = run_ml_prediction(features)
        
        escalation_prob = prediction_result["escalation_probability"]
        priority = prediction_result["priority"]
        risk_factors = prediction_result["risk_factors"]
        recommended_action = prediction_result["recommended_action"]
        
        # 4. Construct complete report document
        doc = {
            "report_id": report_id,
            "user_id": user["id"],
            "reporter_name": user.get("name", "Citizen"),
            "title": report_data["title"],
            "category": report_data["category"],
            "location_name": report_data["location_name"],
            "latitude": float(report_data["latitude"]),
            "longitude": float(report_data["longitude"]),
            "description": report_data["description"],
            "current_severity": int(report_data["current_severity"]),
            "days_unresolved": int(report_data["days_unresolved"]),
            "image_url": report_data.get("image_url"),
            "status": "OPEN",
            "escalation_probability": escalation_prob,
            "priority": priority,
            "risk_factors": risk_factors,
            "recommended_action": recommended_action,
            "ml_features": features,
            "created_at": now_str,
            "updated_at": now_str
        }
        
        saved_report = await db.create_report(doc)
        
        # 5. Store detailed prediction record
        pred_id = f"PRED-{uuid.uuid4().hex[:8].upper()}"
        pred_doc = {
            "prediction_id": pred_id,
            "report_id": report_id,
            "escalation_probability": escalation_prob,
            "priority": priority,
            "confidence": prediction_result["confidence"],
            "estimated_escalation_days": prediction_result["estimated_escalation_days"],
            "risk_factors": risk_factors,
            "recommended_action": recommended_action,
            "class_probabilities": prediction_result.get("class_probabilities"),
            "model_name": prediction_result["model_name"],
            "created_at": now_str
        }
        await db.create_prediction(pred_doc)
        
        # 6. Automatic Alert Generation if escalation_prob >= 80% or priority == CRITICAL
        if escalation_prob >= 80.0 or priority == "CRITICAL":
            alert_id = f"ALT-{uuid.uuid4().hex[:8].upper()}"
            alert_doc = {
                "alert_id": alert_id,
                "report_id": report_id,
                "alert_type": "CRITICAL_ESCALATION",
                "message": f"Critical escalation alert: High-risk {report_data['category']} at {report_data['location_name']} (Risk: {escalation_prob}%).",
                "priority": priority,
                "escalation_probability": escalation_prob,
                "location_name": report_data["location_name"],
                "category": report_data["category"],
                "risk_factors": risk_factors,
                "recommended_action": recommended_action,
                "is_read": False,
                "created_at": now_str
            }
            await db.create_alert(alert_doc)
            
        # 7. Record initial status history
        hist_id = f"HIST-{uuid.uuid4().hex[:8].upper()}"
        hist_doc = {
            "id": hist_id,
            "report_id": report_id,
            "old_status": "NONE",
            "new_status": "OPEN",
            "changed_by": user["id"],
            "changed_by_name": user.get("name", "Citizen"),
            "notes": "Issue reported and registered in UrbanPulse system.",
            "changed_at": now_str
        }
        await db.create_status_history(hist_doc)
        
        return saved_report

    @staticmethod
    async def update_status(
        db: DatabaseAdapter,
        report_id: str,
        new_status: str,
        user: dict,
        notes: Optional[str] = None
    ) -> Optional[dict]:
        existing = await db.get_report_by_id(report_id)
        if not existing:
            return None
            
        old_status = existing.get("status", "OPEN")
        now_str = datetime.datetime.utcnow().isoformat()
        
        updated = await db.update_report_status(report_id, new_status)
        
        # Record status history audit trail
        hist_id = f"HIST-{uuid.uuid4().hex[:8].upper()}"
        hist_doc = {
            "id": hist_id,
            "report_id": report_id,
            "old_status": old_status,
            "new_status": new_status,
            "changed_by": user["id"],
            "changed_by_name": user.get("name", "Authority"),
            "notes": notes or f"Status changed from {old_status} to {new_status}",
            "changed_at": now_str
        }
        await db.create_status_history(hist_doc)
        
        return updated
