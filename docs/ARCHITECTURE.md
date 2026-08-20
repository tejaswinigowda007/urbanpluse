# UrbanPulse — System Architecture & Design Specification

This document details the software architecture, data models, modular database layer, machine learning pipeline, and component interaction flows of UrbanPulse.

---

## 1. High-Level Architecture Diagram

```
+-------------------------------------------------------------------------------+
|                             CLIENT TIER (React + Vite)                        |
|  +---------------------+   +-----------------------+   +-------------------+  |
|  |  Citizen Dashboard  |   |  Authority Dashboard  |   |    Live Map (OSM) |  |
|  +----------+----------+   +-----------+-----------+   +---------+---------+  |
|             |                          |                         |            |
|  +----------+--------------------------+-------------------------+---------+  |
|  |              Axios API Client (JWT Bearer Auth Interceptor)             |  |
+--+-------------------------------------+-----------------------------------+--+
                                         |
                                         | REST APIs (HTTP / JSON)
                                         v
+-------------------------------------------------------------------------------+
|                            API & BACKEND TIER (FastAPI)                       |
|  +-------------------------------------------------------------------------+  |
|  |                       FastAPI Application Gateway                       |  |
|  |       CORS Middleware | Static Files Mount (/uploads) | Auth Guards     |  |
|  +-----+-----------------+-----------------+-----------------+-------------+  |
|        |                 |                 |                 |                |
|        v                 v                 v                 v                |
|  +------------+   +--------------+   +------------+   +--------------------+  |
|  | Auth Route |   | Report Route |   | Trend Svc  |   | ML Inference Route |  |
|  +-----+------+   +-------+------+   +-----+------+   +---------+----------+  |
+--------|------------------|----------------|--------------------|-------------+
         |                  |                |                    |
         v                  v                v                    v
+-------------------------------------------------+  +--------------------------+
|         MODULAR DATABASE ADAPTER LAYER          |  |   SCIKIT-LEARN ML CORE   |
|                                                 |  |                          |
|  +-------------------------------------------+  |  |  +--------------------+  |
|  |        Abstract DatabaseAdapter           |  |  |  |  Preprocessed Input |  |
|  +---------------------+---------------------+  |  |  +---------+----------+  |
|                        |                        |  |            |             |
|          +-------------+-------------+          |  |            v             |
|          |                           |          |  |  +--------------------+  |
|          v                           v          |  |  |   RandomForest     |  |
|  +---------------+           +---------------+  |  |  |    Classifier      |  |
|  |    MongoDB    |           | SQLite Doc    |  |  |  | (120 Estimators)   |  |
|  | (Motor Client)|           |   Fallback    |  |  |  +---------+----------+  |
|  +---------------+           +---------------+  |  |            |             |
|  (users, reports, predictions, alerts, hist)   |  |            v             |
+-------------------------------------------------+  |  +--------------------+  |
                                                     |  | Proba Distribution |  |
                                                     |  | & Escalation Risk  |  |
                                                     |  +--------------------+  |
                                                     +--------------------------+
```

---

## 2. End-to-End Issue Reporting & Prediction Flow

```
[Citizen User]
      │
      │ 1. Submits Issue Form (Category, Location, Severity, Duration, Photo)
      ▼
[FastAPI /api/reports Endpoint]
      │
      │ 2. Queries Existing Database Reports in Radius
      │ 3. Computes: nearby_reports, frequency_7d, freq_change_%
      ▼
[ML Service & Random Forest Model]
      │
      │ 4. Encodes Categoricals (LabelEncoder) & Scales Numerical Features
      │ 5. Model Inference -> Predicts [P(Low), P(Med), P(High), P(Crit)]
      │ 6. Calculates Escalation Probability (0-100%) & Priority Level
      │ 7. Extracts Dominant Risk Factors & Formulates Action Plan
      ▼
[Modular Database Layer]
      │
      │ 8. Saves Report Document (Status = "OPEN")
      │ 9. Saves Prediction Document
      │ 10. Checks Threshold: If Escalation Prob ≥ 80% or Priority == CRITICAL:
      │       --> Inserts Critical Escalation Alert into "alerts"
      │ 11. Inserts Initial Status History Record
      ▼
[Response to Frontend Client]
      │
      │ 12. Returns Full Report + Instant AI Escalation Feedback Modal
      │ 13. Map & Live Feed dynamically refresh
```

---

## 3. Database Schema Design (Document Collections)

### 1. `users` Collection
```json
{
  "id": "USR-DEMO-CITIZEN",
  "name": "Arjun Sharma",
  "email": "citizen@urbanpulse.demo",
  "password_hash": "$2b$12$...",
  "role": "CITIZEN",
  "created_at": "2026-01-01T00:00:00"
}
```

### 2. `reports` Collection
```json
{
  "report_id": "REP-8A2F1B9C",
  "user_id": "USR-DEMO-CITIZEN",
  "reporter_name": "Arjun Sharma",
  "title": "Pothole near Bannerghatta Road",
  "category": "Pothole",
  "location_name": "Bannerghatta Road",
  "latitude": 12.8988,
  "longitude": 77.5998,
  "description": "Deep road depression near Vega City Mall...",
  "current_severity": 4,
  "days_unresolved": 5,
  "image_url": "/uploads/img_3fa85f64.jpg",
  "status": "OPEN",
  "escalation_probability": 84.5,
  "priority": "CRITICAL",
  "risk_factors": [
    "High initial severity level (Rating: 4/5)",
    "Located in high-density traffic corridor (High traffic)",
    "Cluster of 8 concurrent reports in immediate vicinity"
  ],
  "recommended_action": "URGENT DISPATCH: Deploy rapid-response municipal crew within 2-4 hours...",
  "created_at": "2026-08-19T14:20:00",
  "updated_at": "2026-08-19T14:20:00"
}
```

### 3. `predictions` Collection
```json
{
  "prediction_id": "PRED-9C21A4B0",
  "report_id": "REP-8A2F1B9C",
  "escalation_probability": 84.5,
  "priority": "CRITICAL",
  "confidence": 0.88,
  "estimated_escalation_days": 2,
  "risk_factors": [...],
  "recommended_action": "...",
  "model_name": "Random Forest Classifier",
  "class_probabilities": {
    "LOW": 0.02,
    "MEDIUM": 0.10,
    "HIGH": 0.28,
    "CRITICAL": 0.60
  },
  "created_at": "2026-08-19T14:20:00"
}
```

### 4. `alerts` Collection
```json
{
  "alert_id": "ALT-1E7C4D90",
  "report_id": "REP-8A2F1B9C",
  "alert_type": "CRITICAL_ESCALATION",
  "message": "Critical risk alert: Pothole at Bannerghatta Road (Risk: 84.5%).",
  "priority": "CRITICAL",
  "escalation_probability": 84.5,
  "location_name": "Bannerghatta Road",
  "category": "Pothole",
  "risk_factors": [...],
  "recommended_action": "...",
  "is_read": false,
  "created_at": "2026-08-19T14:20:00"
}
```

### 5. `status_history` Collection
```json
{
  "id": "HIST-4F8A2E10",
  "report_id": "REP-8A2F1B9C",
  "old_status": "OPEN",
  "new_status": "IN PROGRESS",
  "changed_by": "USR-DEMO-AUTHORITY",
  "changed_by_name": "Dr. Ramesh Rao (Authority)",
  "notes": "Maintenance team dispatched to site.",
  "changed_at": "2026-08-19T14:25:00"
}
```

---

## 4. Security & Role-Based Access Control

- **JWT Tokens**: Signed with HMAC-SHA256 containing `sub` (User ID), `role` (`CITIZEN` or `AUTHORITY`), and `email`.
- **Password Protection**: Salted Bcrypt hashing with cost factor 12.
- **FastAPI Security Dependencies**:
  - `get_current_user`: Validates token header and loads user profile.
  - `require_authority`: Enforces `role === 'AUTHORITY'`, rejecting unauthorized citizen modifications with HTTP 403 Forbidden.