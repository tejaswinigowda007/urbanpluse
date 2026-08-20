import os
import sys
import math
from typing import Dict, Any, List

# Add ml root to path
ml_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml"))
if ml_root not in sys.path:
    sys.path.insert(0, ml_root)

try:
    from predict import predict_micro_issue
except ImportError:
    # Fallback import if package root differs
    from ml.predict import predict_micro_issue

def calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def extract_features_from_report(report_data: dict, existing_reports: List[dict]) -> dict:
    category = report_data.get("category", "Pothole")
    severity = int(report_data.get("current_severity", 3))
    days = int(report_data.get("days_unresolved", 1))
    lat = float(report_data.get("latitude", 12.9716))
    lon = float(report_data.get("longitude", 77.5946))
    loc_name = str(report_data.get("location_name", ""))
    
    # Calculate nearby reports (within 2km or matching location name)
    nearby_count = 0
    recent_category_count = 0
    prior_week_count = 0
    
    for r in existing_reports:
        r_lat = float(r.get("latitude", 0.0))
        r_lon = float(r.get("longitude", 0.0))
        dist = calculate_distance_km(lat, lon, r_lat, r_lon)
        if dist <= 2.0 or loc_name.lower() in str(r.get("location_name", "")).lower():
            nearby_count += 1
            if r.get("category") == category:
                recent_category_count += 1
                
    # Approximate frequency change
    freq_7d = max(1, recent_category_count)
    freq_change_pct = min(150.0, max(-30.0, (freq_7d - 2) * 18.5))
    
    # Location Risk Score based on location name characteristics
    loc_lower = loc_name.lower()
    if "bannerghatta" in loc_lower or "electronic city" in loc_lower or "outer ring" in loc_lower:
        loc_risk = 8
        traffic = "High"
        pop_density = "High"
    elif "btm" in loc_lower or "koramangala" in loc_lower or "indiranagar" in loc_lower:
        loc_risk = 7
        traffic = "High"
        pop_density = "High"
    elif "jp nagar" in loc_lower or "jayanagar" in loc_lower or "hsr" in loc_lower:
        loc_risk = 6
        traffic = "Medium"
        pop_density = "High"
    else:
        loc_risk = 5
        traffic = report_data.get("traffic_level", "Medium")
        pop_density = "Medium"
        
    return {
        "issue_type": category,
        "current_severity": severity,
        "days_unresolved": days,
        "nearby_reports": min(nearby_count, 25),
        "frequency_last_7_days": min(freq_7d, 20),
        "frequency_change_percentage": round(freq_change_pct, 1),
        "traffic_level": traffic,
        "population_density": pop_density,
        "location_risk_score": loc_risk,
        "historical_escalations": min(int(nearby_count / 3), 8),
        "weather_factor": report_data.get("weather_factor", "Clear")
    }

def run_ml_prediction(feature_dict: dict) -> dict:
    return predict_micro_issue(feature_dict)
