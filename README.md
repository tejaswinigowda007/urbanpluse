# UrbanPulse — AI-Based Micro-Issue Trend and Escalation Predictor for Urban Systems

[![Project Type](https://img.shields.io/badge/Project-BE%20CSE--AIML%20Major%20Project-blue.svg)](#)
[![Prototype Implementation](https://img.shields.io/badge/Implementation-70%25%20Functional%20Prototype-emerald.svg)](#)
[![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20FastAPI%20%7C%20Scikit--Learn%20%7C%20Leaflet-orange.svg)](#)

> **UrbanPulse** is an intelligent full-stack Smart City platform designed to transform urban municipal management from **reactive maintenance** to **proactive escalation prevention**. It captures micro-issues (potholes, water leaks, garbage accumulation, streetlight failures, drainage blocks, road damage), feeds spatial-temporal features into a trained **Random Forest Classifier**, predicts escalation probabilities and priority levels, and generates real-time municipal alerts and trend intelligence.

---

## 1. Project Objectives & Workflow

Urban micro-issues often go unaddressed until they compound into severe civic hazards (e.g. small potholes becoming accident zones during heavy rainfall). UrbanPulse automates the entire lifecycle:

```
Citizen Report
      ↓
Data Collection & Spatial Feature Extraction
      ↓
Machine Learning Inference (Random Forest Classifier)
      ↓
Escalation Probability (0–100%) & Priority Classification (LOW, MEDIUM, HIGH, CRITICAL)
      ↓
Database Document Storage (MongoDB / Zero-Config SQLite Fallback)
      ↓
Automated Critical Alert Triggering (Risk ≥ 80% or CRITICAL)
      ↓
Authority Command Dashboard & Leaflet Geospatial Map
      ↓
Status Lifecycle Management (OPEN → ASSIGNED → IN PROGRESS → RESOLVED)
```

---

## 2. Technology Stack

- **Frontend**: React.js (v18), Vite, Tailwind CSS, React Router DOM, Recharts (Data Visualizations), Lucide React (Icons), Leaflet & OpenStreetMap (Geospatial Mapping — Zero Paid API keys).
- **Backend**: Python 3.11, FastAPI, Uvicorn, Pydantic, Python-JOSE (JWT Authentication), Passlib (Bcrypt).
- **Database**: Dual Modular Layer:
  - **MongoDB** (Primary via `motor` / `pymongo`)
  - **SQLite Local Document Store** (Automatic zero-configuration fallback when MongoDB service is not running locally).
- **Machine Learning**: Python, Scikit-learn, Pandas, NumPy, Joblib (Trained `RandomForestClassifier`, standard scaler, label encoders).

---

## 3. Project Folder Structure

```
UrbanPulse/
├── frontend/                     # React + Vite + Tailwind Client
│   ├── public/
│   ├── src/
│   │   ├── components/           # UI components (Sidebar, Navbar, KPICard, IssueMap, AIAnalysisModal, etc.)
│   │   ├── pages/                # Dashboards, Reporting, Live Feed, Map, Trends, Management, ML Performance
│   │   ├── layouts/
│   │   ├── services/             # Axios API client modules
│   │   ├── context/              # AuthContext (JWT state management)
│   │   └── utils/
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── backend/                      # FastAPI Backend Server
│   ├── app/
│   │   ├── main.py               # FastAPI entrypoint, middleware, static files
│   │   ├── routes/               # API endpoints (auth, reports, predict, analytics, alerts, ml_performance)
│   │   ├── models/               # Pydantic data schemas
│   │   ├── services/             # Report pipeline, ML inference, Trend analytics, Alerts
│   │   ├── database/             # Modular DB interface (MongoDB + SQLite fallback)
│   │   └── auth/                 # JWT security & role guards
│   ├── uploads/                  # Uploaded issue photos
│   └── requirements.txt
├── ml/                           # Machine Learning Pipeline
│   ├── dataset/
│   │   ├── generate_dataset.py   # Synthetic dataset generator (1,500 domain records)
│   │   └── synthetic_micro_issues.csv
│   ├── models/
│   │   ├── random_forest_model.joblib
│   │   ├── preprocessor.joblib
│   │   └── metrics.json          # Empirical evaluation metrics
│   ├── preprocessing.py          # Encoders and scalers
│   ├── train_model.py            # Model training & evaluation (80/20 split)
│   ├── predict.py                # Standalone & API inference module
│   ├── evaluate_model.py         # Formatted evaluation report utility
│   └── requirements.txt
├── data/
│   └── seed_demo_data.py         # Seeds 75+ realistic Bengaluru reports across 7 clustered zones
├── docs/
│   ├── ARCHITECTURE.md
│   ├── ML_DOCUMENTATION.md
│   └── API_DOCUMENTATION.md
├── .env.example
└── README.md
```

---

## 4. Quickstart & Local Execution Instructions

### Prerequisites
- **Python 3.10+** (installed with pip)
- **Node.js 18+ & npm**
- *(Optional)* **MongoDB** (if not installed, UrbanPulse automatically runs SQLite local document storage).

### Step 1: Clone & Setup Python Dependencies
```bash
# From the UrbanPulse root folder:
pip install -r backend/requirements.txt
```

### Step 2: Train Machine Learning Model & Seed Demo Data
```bash
# 1. Generate dataset and train the Random Forest model:
python ml/dataset/generate_dataset.py
python ml/train_model.py

# 2. Seed realistic Bengaluru demo reports (75+ records):
python data/seed_demo_data.py
```

### Step 3: Start the Backend Server
```bash
cd backend
uvicorn app.main:app --reload --port 8000
# Backend runs at http://127.0.0.1:8000 (API Docs at http://127.0.0.1:8000/docs)
```

### Step 4: Start the Frontend Application
```bash
# In a new terminal:
cd frontend
npm install
npm run dev
# Frontend runs at http://localhost:5173
```

---

## 5. Demo Accounts & Credentials

The system includes pre-seeded demo accounts with **1-Click Demo Login** buttons on the login screen:

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@urbanpulse.demo` | `DemoPass123!` | Report Issues, My Reports, Live Feed, Live Map, Trend Intelligence, Alerts |
| **Authority** | `authority@urbanpulse.demo` | `DemoPass123!` | Full City Command Center, Issue Management, ML Performance, Alert Dispatch |

*(Citizens can also register new accounts dynamically via the `/register` page).*

---

## 6. 5-Minute College Review Demo Procedure

Follow this exact walkthrough during your major project viva/presentation:

1. **Open Application**: Navigate to `http://localhost:5173`.
2. **Login as Citizen**: Click **"Demo Citizen"** (or login with `citizen@urbanpulse.demo` / `DemoPass123!`).
3. **Inspect Citizen Dashboard**: Note the 4 summary KPIs and recent reports.
4. **Submit a New Issue**:
   - Click **"Report New Issue"**.
   - Click the preset **"Bannerghatta Road"** hub.
   - Select Category: **"Pothole"**.
   - Set Severity to **4 / 5** and Days Unresolved to **5**.
   - Enter Description: *"Expanding crater pothole near Vega City Mall creating hazard for two-wheelers."*
   - Click **"Submit Report & Predict Escalation"**.
5. **Observe Instant AI Prediction**:
   - The AI Feedback Modal pops up immediately.
   - Observe predicted **Escalation Probability (> 80%)**, **Priority: CRITICAL**, estimated escalation days (1-2 days), extracted risk factors, and recommended action.
6. **Verify Live Incident Feed & Map**:
   - Open **"Live Feed"** & **"Live Map"** to see your newly reported issue appearing immediately at Bannerghatta Road.
7. **Switch to Authority Mode**:
   - Logout and click **"Demo Authority"** (`authority@urbanpulse.demo` / `DemoPass123!`).
8. **Inspect Authority Command Center**:
   - Review 6 Top KPIs, 30-Day volume trend, Category Donut chart, and the new **Critical Escalation Alert**.
9. **Open Trend Intelligence**:
   - View Recharts visualizations, Week-over-Week % increases, and deterministic rule-based analytical insights.
10. **Open ML Model Performance**:
    - View the actual trained Random Forest metrics: **Accuracy, Precision, Recall, F1 Score, 4x4 Confusion Matrix heatmap**, and **Feature Importance rankings**.
11. **Resolve the Issue via Issue Management**:
    - Navigate to **"Issue Management"**.
    - Find the Bannerghatta Road pothole.
    - Click **"Dispatch Crew"** (status changes to `IN PROGRESS`), enter audit note.
    - Click **"Mark Resolved"** (status changes to `RESOLVED`).
    - Click the **History icon** to inspect the complete audit trail.
12. **Verify Citizen Update**:
    - Logout and re-login as Citizen → Check **"My Reports"** to confirm the status is updated to `RESOLVED`!

---

## 7. Prototype Scope: 70% Implemented vs Remaining 30%

###  Completed 70% Scope (Current Working Prototype)
- Full JWT authentication & role-based access control (Citizen vs Authority).
- Complete citizen reporting workflow with spatial feature extraction.
- Genuine Scikit-learn Random Forest model training, Joblib serialization, and live REST inference.
- Real empirical evaluation metrics (Accuracy, Precision, Recall, F1, Confusion Matrix, Feature Importance).
- Modular dual database layer (MongoDB with zero-config SQLite document store fallback).
- Interactive Leaflet OpenStreetMap centered on Bengaluru with custom priority markers.
- Auto-polling Live Feed.
- Calculated Trend Intelligence & Deterministic Analytical Insights.
- Status transition workflow with complete status history audit trail.
- Critical escalation alert dispatch system.

###  Remaining 30% Scope (Future Roadmap)
- Physical IoT acoustic & vibration accelerometer hardware sensors on road infrastructure.
- Direct bidirectional sync with legacy municipal government relational databases.
- Multi-million record citywide real-world telemetry dataset.
- Deep learning computer vision models (YOLOv9) for automatic pothole dimension estimation from images.
- Native Android/iOS mobile applications.
- Multi-city distributed cloud deployment.

---

## 8. Academic Integrity & Dataset Disclaimer

- **Dataset**: `synthetic_micro_issues.csv` is a synthetic prototype dataset generated with structured domain correlations specifically for major project demonstration and development.
- **Explainability**: AI predictions are generated by an authentic trained `RandomForestClassifier`. No values or charts are hard-coded.