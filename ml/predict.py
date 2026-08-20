import os
import joblib
import numpy as np
import pandas as pd
try:
    from ml.preprocessing import UrbanPulsePreprocessor, PRIORITY_MAPPING, REVERSE_PRIORITY_MAPPING
except ImportError:
    from preprocessing import UrbanPulsePreprocessor, PRIORITY_MAPPING, REVERSE_PRIORITY_MAPPING

_MODEL = None
_PREPROCESSOR = None

def get_model_and_preprocessor():
    global _MODEL, _PREPROCESSOR
    if _MODEL is None or _PREPROCESSOR is None:
        models_dir = os.path.join(os.path.dirname(__file__), "models")
        model_path = os.path.join(models_dir, "random_forest_model.joblib")
        preproc_path = os.path.join(models_dir, "preprocessor.joblib")
        
        if not os.path.exists(model_path) or not os.path.exists(preproc_path):
            raise FileNotFoundError(f"Model artifacts not found in {models_dir}. Please run train_model.py first.")
            
        _MODEL = joblib.load(model_path)
        _PREPROCESSOR = joblib.load(preproc_path)
    return _MODEL, _PREPROCESSOR

def generate_risk_factors(data: dict) -> list[str]:
    factors = []
    severity = int(data.get("current_severity", 1))
    days = int(data.get("days_unresolved", 1))
    nearby = int(data.get("nearby_reports", 0))
    freq_change = float(data.get("frequency_change_percentage", 0.0))
    traffic = str(data.get("traffic_level", "Medium"))
    weather = str(data.get("weather_factor", "Clear"))
    issue_type = str(data.get("issue_type", "Pothole"))
    hist_esc = int(data.get("historical_escalations", 0))
    
    if severity >= 4:
        factors.append(f"High initial severity level (Rating: {severity}/5)")
    if days >= 7:
        factors.append(f"Issue unresolved for extended period ({days} days)")
    elif days >= 3:
        factors.append(f"Issue pending resolution for {days} days")
    if nearby >= 5:
        factors.append(f"Cluster of {nearby} concurrent reports in immediate vicinity")
    if freq_change > 20.0:
        factors.append(f"Surge in issue frequency (+{freq_change:.1f}% vs prior week)")
    if traffic in ["High", "Very High"]:
        factors.append(f"Located in high-density traffic corridor ({traffic} traffic)")
    if weather in ["Heavy Rain", "Storm"] and issue_type in ["Drainage", "Water Leakage", "Road Damage"]:
        factors.append(f"Adverse weather condition ({weather}) compounding infrastructure stress")
    if hist_esc >= 3:
        factors.append(f"Location has historical recurrence pattern ({hist_esc} past escalations)")
        
    if not factors:
        factors.append("Standard municipal micro-issue with baseline localized parameters")
        
    return factors

def generate_recommended_action(priority: str, issue_type: str, escalation_prob: float) -> str:
    if priority == "CRITICAL" or escalation_prob >= 80.0:
        return f"URGENT DISPATCH: Deploy rapid-response municipal crew within 2-4 hours to inspect and mitigate {issue_type}. Issue automated citizen alert."
    elif priority == "HIGH" or escalation_prob >= 60.0:
        return f"HIGH PRIORITY: Schedule field inspection and assign maintenance crew within 24 hours. Coordinate with zonal engineering department."
    elif priority == "MEDIUM" or escalation_prob >= 40.0:
        return f"ROUTINE MAINTENANCE: Log into weekly zonal maintenance schedule. Monitor trend changes over next 48 hours."
    else:
        return f"STANDARD MONITORING: Keep issue logged under regular observation. Assign to standard low-priority municipal queue."

def estimate_escalation_days(priority: str, escalation_prob: float, days_unresolved: int) -> int:
    if priority == "CRITICAL":
        return max(1, 2 - int(days_unresolved / 10))
    elif priority == "HIGH":
        return max(2, 4 - int(days_unresolved / 8))
    elif priority == "MEDIUM":
        return max(5, 8 - int(days_unresolved / 6))
    else:
        return 14

def predict_micro_issue(feature_dict: dict) -> dict:
    """
    Main ML inference function for UrbanPulse.
    Takes micro-issue parameters and produces genuine Random Forest predictions.
    """
    model, preprocessor = get_model_and_preprocessor()
    
    # Ensure default fields are present
    defaults = {
        "issue_type": "Pothole",
        "current_severity": 3,
        "days_unresolved": 3,
        "nearby_reports": 2,
        "frequency_last_7_days": 3,
        "frequency_change_percentage": 0.0,
        "traffic_level": "Medium",
        "population_density": "Medium",
        "location_risk_score": 5,
        "historical_escalations": 1,
        "weather_factor": "Clear"
    }
    merged_data = {**defaults, **feature_dict}
    
    # Transform input
    X_input = preprocessor.transform_single(merged_data)
    
    # Predict probabilities for classes: [LOW, MEDIUM, HIGH, CRITICAL]
    probas = model.predict_proba(X_input)[0]
    
    # Calculate escalation probability (0 to 100%)
    # Weighted by severity of escalation
    # LOW: 0.10, MEDIUM: 0.40, HIGH: 0.75, CRITICAL: 1.00
    weights = np.array([0.08, 0.38, 0.78, 1.00])
    raw_prob = np.sum(probas * weights) * 100.0
    
    # Slight severity calibration
    sev_bonus = (merged_data["current_severity"] - 3) * 3.5
    escalation_prob = float(np.clip(raw_prob + sev_bonus, 5.0, 98.5))
    
    # Determine Priority class
    predicted_idx = int(np.argmax(probas))
    priority = REVERSE_PRIORITY_MAPPING[predicted_idx]
    
    # Calibrate priority if escalation probability is very high
    if escalation_prob >= 78.0 and priority not in ["CRITICAL", "HIGH"]:
        priority = "HIGH"
    if escalation_prob >= 85.0:
        priority = "CRITICAL"
        
    confidence = float(np.max(probas))
    risk_factors = generate_risk_factors(merged_data)
    recommended_action = generate_recommended_action(priority, merged_data["issue_type"], escalation_prob)
    est_days = estimate_escalation_days(priority, escalation_prob, merged_data["days_unresolved"])
    
    return {
        "escalation_probability": round(escalation_prob, 1),
        "priority": priority,
        "confidence": round(confidence, 2),
        "estimated_escalation_days": est_days,
        "risk_factors": risk_factors,
        "recommended_action": recommended_action,
        "model_name": "Random Forest Classifier",
        "class_probabilities": {
            "LOW": round(float(probas[0]), 3),
            "MEDIUM": round(float(probas[1]), 3),
            "HIGH": round(float(probas[2]), 3),
            "CRITICAL": round(float(probas[3]), 3)
        }
    }

if __name__ == "__main__":
    sample_input = {
        "issue_type": "Pothole",
        "current_severity": 4,
        "days_unresolved": 6,
        "nearby_reports": 8,
        "frequency_last_7_days": 7,
        "frequency_change_percentage": 45.0,
        "traffic_level": "High",
        "population_density": "High",
        "location_risk_score": 8,
        "historical_escalations": 3,
        "weather_factor": "Moderate Rain"
    }
    result = predict_micro_issue(sample_input)
    print("\n--- INFERENCE RESULT FOR SAMPLE INPUT ---")
    for k, v in result.items():
        print(f"{k}: {v}")
