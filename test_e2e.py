import os
import sys

# Add paths
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "backend", "app")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "ml")))

from fastapi.testclient import TestClient
from main import app

def run_e2e_tests():
    print("\n================ STARTING URBANPULSE E2E TESTS ================")
    
    with TestClient(app) as client:
        # 1. Health check
        res = client.get("/api/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print(" 1. Health check passed:", res.json())
        
        # 2. Login as Demo Citizen
        res = client.post("/api/auth/login", json={
            "email": "citizen@urbanpulse.demo",
            "password": "DemoPass123!"
        })
        assert res.status_code == 200, f"Citizen login failed: {res.text}"
        citizen_token = res.json()["access_token"]
        citizen_headers = {"Authorization": f"Bearer {citizen_token}"}
        print(" 2. Citizen login successful. User:", res.json()["user"]["name"])
        
        # 3. Login as Demo Authority
        res = client.post("/api/auth/login", json={
            "email": "authority@urbanpulse.demo",
            "password": "DemoPass123!"
        })
        assert res.status_code == 200, f"Authority login failed: {res.text}"
        authority_token = res.json()["access_token"]
        authority_headers = {"Authorization": f"Bearer {authority_token}"}
        print(" 3. Authority login successful. User:", res.json()["user"]["name"])
        
        # 4. Test Standalone ML Predict Endpoint
        predict_payload = {
            "issue_type": "Pothole",
            "current_severity": 4,
            "days_unresolved": 5,
            "nearby_reports": 7,
            "frequency_last_7_days": 6,
            "frequency_change_percentage": 40.0,
            "traffic_level": "High",
            "population_density": "High",
            "location_risk_score": 8,
            "historical_escalations": 3,
            "weather_factor": "Moderate Rain"
        }
        res = client.post("/api/predict", json=predict_payload)
        assert res.status_code == 200, f"Predict API failed: {res.text}"
        pred_data = res.json()
        print(" 4. ML Predict API output:")
        print(f"    - Escalation Prob: {pred_data['escalation_probability']}%")
        print(f"    - Priority: {pred_data['priority']}")
        print(f"    - Risk Factors: {len(pred_data['risk_factors'])} factors identified")
        print(f"    - Recommended Action: {pred_data['recommended_action'][:60]}...")
        
        # 5. Citizen Submits Real Issue Report
        report_payload = {
            "title": "Severe Pothole Cluster near Vega City Mall",
            "category": "Pothole",
            "location_name": "Bannerghatta Road",
            "latitude": 12.8988,
            "longitude": 77.5998,
            "description": "Deep asphalt depression causing high risk for two-wheelers and heavy traffic congestion.",
            "current_severity": 4,
            "days_unresolved": 5,
            "traffic_level": "Very High",
            "weather_factor": "Clear"
        }
        res = client.post("/api/reports", json=report_payload, headers=citizen_headers)
        assert res.status_code == 201, f"Report submission failed: {res.text}"
        created_rep = res.json()
        rep_id = created_rep["report_id"]
        print(f" 5. Issue submitted successfully: {rep_id}")
        print(f"    - Status: {created_rep['status']}")
        print(f"    - ML Priority: {created_rep['priority']}")
        print(f"    - ML Escalation Prob: {created_rep['escalation_probability']}%")
        
        # 6. Verify Status History initial entry
        res = client.get(f"/api/reports/{rep_id}/history", headers=citizen_headers)
        assert res.status_code == 200, f"History fetch failed: {res.text}"
        hist = res.json()
        assert len(hist) >= 1, "Expected at least 1 history record"
        print(f" 6. Status History verified: {len(hist)} initial log(s). Status: {hist[0]['new_status']}")
        
        # 7. Authority updates status: OPEN -> IN PROGRESS
        res = client.patch(f"/api/reports/{rep_id}/status", json={
            "status": "IN PROGRESS",
            "notes": "Dispatched zonal road repair crew to Bannerghatta Road."
        }, headers=authority_headers)
        assert res.status_code == 200, f"Status update failed: {res.text}"
        assert res.json()["status"] == "IN PROGRESS"
        print(" 7. Authority status update to IN PROGRESS successful.")
        
        # 8. Authority marks issue RESOLVED
        res = client.patch(f"/api/reports/{rep_id}/status", json={
            "status": "RESOLVED",
            "notes": "Pothole hot-mix asphalt patching completed and verified."
        }, headers=authority_headers)
        assert res.status_code == 200, f"Resolve status failed: {res.text}"
        assert res.json()["status"] == "RESOLVED"
        print(" 8. Authority marked issue RESOLVED successfully.")
        
        # 9. Verify History has 3 transition events
        res = client.get(f"/api/reports/{rep_id}/history", headers=citizen_headers)
        hist = res.json()
        assert len(hist) == 3, f"Expected 3 history records, got {len(hist)}"
        print(f" 9. Full status audit trail verified: 3 chronological events.")
        
        # 10. Check Trend Intelligence API
        res = client.get("/api/analytics/trends")
        assert res.status_code == 200, f"Trends API failed: {res.text}"
        trends = res.json()
        print(" 10. Trend Intelligence API verified:")
        print(f"     - Total Reports in DB: {trends['kpis']['total_reports']}")
        print(f"     - Category Cards: {len(trends['category_summary_cards'])} categories")
        print(f"     - Deterministic Insights: {len(trends['deterministic_insights'])} insights generated")
        
        # 11. Check ML Performance API
        res = client.get("/api/ml/performance")
        assert res.status_code == 200, f"ML Performance API failed: {res.text}"
        ml_perf = res.json()
        print(" 11. ML Performance API verified:")
        print(f"     - Model: {ml_perf['model_name']}")
        print(f"     - Accuracy: {ml_perf['accuracy']*100:.2f}%")
        print(f"     - F1-Score: {ml_perf['f1_score']*100:.2f}%")
        
        # 12. Check Critical Alerts API
        res = client.get("/api/alerts")
        assert res.status_code == 200, f"Alerts API failed: {res.text}"
        alerts = res.json()
        print(f" 12. Critical Alerts API verified: {len(alerts)} alerts currently tracked.")
        
        print("\n================ ALL 12 E2E TESTS PASSED SUCCESSFULLY! ================\n")

if __name__ == "__main__":
    run_e2e_tests()