# UrbanPulse — REST API Documentation

Base URL: `http://localhost:8000/api`

---

## 1. Authentication Endpoints

### `POST /api/auth/register`
Registers a new citizen user.
- **Request Body**:
  ```json
  {
    "name": "Aarav Gupta",
    "email": "aarav@example.com",
    "password": "Password123!",
    "role": "CITIZEN"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": "USR-12345678",
      "name": "Aarav Gupta",
      "email": "aarav@example.com",
      "role": "CITIZEN",
      "created_at": "2026-08-19T14:00:00"
    }
  }
  ```

### `POST /api/auth/login`
Authenticates user and returns JWT bearer token.
- **Request Body**:
  ```json
  {
    "email": "authority@urbanpulse.demo",
    "password": "DemoPass123!"
  }
  ```

---

## 2. Machine Learning Inference Endpoint

### `POST /api/predict`
Runs live Random Forest model prediction.
- **Request Body**:
  ```json
  {
    "issue_type": "Pothole",
    "current_severity": 4,
    "days_unresolved": 5,
    "nearby_reports": 8,
    "frequency_last_7_days": 6,
    "frequency_change_percentage": 35.0,
    "traffic_level": "High",
    "population_density": "High",
    "location_risk_score": 8,
    "historical_escalations": 3,
    "weather_factor": "Heavy Rain"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "escalation_probability": 86.4,
    "priority": "CRITICAL",
    "confidence": 0.82,
    "estimated_escalation_days": 1,
    "risk_factors": [
      "High initial severity level (Rating: 4/5)",
      "Issue pending resolution for 5 days",
      "Cluster of 8 concurrent reports in immediate vicinity",
      "Located in high-density traffic corridor (High traffic)"
    ],
    "recommended_action": "URGENT DISPATCH: Deploy rapid-response municipal crew within 2-4 hours...",
    "model_name": "Random Forest Classifier",
    "class_probabilities": {
      "LOW": 0.05,
      "MEDIUM": 0.12,
      "HIGH": 0.23,
      "CRITICAL": 0.60
    }
  }
  ```

---

## 3. Issue Reports Endpoints

### `POST /api/reports`
Submits an issue report, executes ML pipeline, saves report & prediction, and triggers alerts if critical.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "title": "Severe Pothole near Vega City Mall",
    "category": "Pothole",
    "location_name": "Bannerghatta Road",
    "latitude": 12.8988,
    "longitude": 77.5998,
    "description": "Expanding pothole creating vehicular hazard.",
    "current_severity": 4,
    "days_unresolved": 5
  }
  ```

### `GET /api/reports`
Query parameters: `user_id`, `category`, `status`, `priority`, `limit`, `offset`.

### `PATCH /api/reports/{id}/status`
*(Authority Only)* Updates status (`OPEN`, `ASSIGNED`, `IN PROGRESS`, `RESOLVED`) and logs to `status_history`.
- **Request Body**:
  ```json
  {
    "status": "IN PROGRESS",
    "notes": "Crew dispatched to site."
  }
  ```

### `GET /api/reports/{id}/history`
Returns chronological audit trail of status changes.

---

## 4. Trend Intelligence & Analytics

### `GET /api/analytics/trends`
Returns 30-day volume timeline, category breakdown, week-over-week % changes, high-risk location heatmap, and deterministic analytical insights.

### `GET /api/analytics/kpis`
Returns live municipal KPI summary.

---

## 5. Alerts & Model Performance

### `GET /api/alerts`
Returns critical escalation alerts (escalation risk $\ge 80\%$ or CRITICAL priority).

### `GET /api/ml/performance`
Returns empirical evaluation metrics, 4x4 confusion matrix, and feature importance rankings.