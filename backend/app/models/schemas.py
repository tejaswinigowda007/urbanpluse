from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

# ================= AUTH SCHEMAS =================
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = Field(default="CITIZEN", pattern="^(CITIZEN|AUTHORITY)$")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ================= ML PREDICTION SCHEMAS =================
class PredictRequest(BaseModel):
    issue_type: str = Field(..., description="Pothole, Water Leakage, Garbage Accumulation, etc.")
    current_severity: int = Field(..., ge=1, le=5)
    days_unresolved: int = Field(..., ge=0, le=100)
    nearby_reports: int = Field(default=0, ge=0)
    frequency_last_7_days: int = Field(default=1, ge=0)
    frequency_change_percentage: float = Field(default=0.0)
    traffic_level: str = Field(default="Medium", pattern="^(Low|Medium|High|Very High)$")
    population_density: str = Field(default="Medium", pattern="^(Low|Medium|High|Very High)$")
    location_risk_score: int = Field(default=5, ge=1, le=10)
    historical_escalations: int = Field(default=0, ge=0)
    weather_factor: str = Field(default="Clear", pattern="^(Clear|Moderate Rain|Heavy Rain|Storm)$")

class PredictResponse(BaseModel):
    escalation_probability: float
    priority: str
    confidence: float
    estimated_escalation_days: int
    risk_factors: List[str]
    recommended_action: str
    model_name: str = "Random Forest Classifier"
    class_probabilities: Optional[Dict[str, float]] = None

# ================= REPORT SCHEMAS =================
class ReportCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    category: str = Field(..., description="Pothole, Water Leakage, Garbage Accumulation, Streetlight Failure, Drainage, Road Damage, Other")
    location_name: str = Field(..., min_length=2, max_length=200)
    latitude: float
    longitude: float
    description: str = Field(..., min_length=5, max_length=2000)
    current_severity: int = Field(..., ge=1, le=5)
    days_unresolved: int = Field(..., ge=0, le=100)
    image_url: Optional[str] = None
    traffic_level: Optional[str] = "Medium"
    weather_factor: Optional[str] = "Clear"

class ReportStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(OPEN|ASSIGNED|IN PROGRESS|RESOLVED)$")
    notes: Optional[str] = None

class ReportResponse(BaseModel):
    report_id: str
    user_id: str
    reporter_name: Optional[str] = "Citizen"
    title: str
    category: str
    location_name: str
    latitude: float
    longitude: float
    description: str
    current_severity: int
    days_unresolved: int
    image_url: Optional[str] = None
    status: str
    escalation_probability: float
    priority: str
    risk_factors: List[str]
    recommended_action: str
    created_at: str
    updated_at: Optional[str] = None

# ================= ALERT SCHEMAS =================
class AlertResponse(BaseModel):
    alert_id: str
    report_id: str
    alert_type: str
    message: str
    priority: str
    escalation_probability: float
    location_name: str
    category: str
    risk_factors: List[str]
    recommended_action: str
    is_read: bool
    created_at: str

# ================= STATUS HISTORY SCHEMAS =================
class StatusHistoryResponse(BaseModel):
    id: str
    report_id: str
    old_status: str
    new_status: str
    changed_by: str
    changed_by_name: Optional[str] = "Authority"
    notes: Optional[str] = None
    changed_at: str

# ================= ANALYTICS SCHEMAS =================
class KPISummary(BaseModel):
    total_reports: int
    open_issues: int
    critical_issues: int
    resolved_issues: int
    high_risk_areas_count: int
    average_escalation_risk: float

class CategoryTrendItem(BaseModel):
    category: str
    count: int
    percentage: float
    risk_level: str
    week_over_week_change: float

class LocationClusterItem(BaseModel):
    location_name: str
    latitude: float
    longitude: float
    total_reports: int
    critical_count: int
    high_count: int
    avg_escalation_prob: float
    dominant_category: str
    risk_score: str

class DeterministicInsight(BaseModel):
    id: str
    category: str
    location: str
    headline: str
    description: str
    escalation_risk: str
    recommended_action: str
    percentage_change: float
    timestamp: str

class TrendAnalyticsResponse(BaseModel):
    kpis: KPISummary
    reports_by_category: List[Dict[str, Any]]
    reports_by_location: List[LocationClusterItem]
    severity_distribution: List[Dict[str, Any]]
    priority_distribution: List[Dict[str, Any]]
    escalation_risk_distribution: List[Dict[str, Any]]
    reports_over_time: List[Dict[str, Any]]
    category_summary_cards: List[CategoryTrendItem]
    deterministic_insights: List[DeterministicInsight]