import os
import random
import numpy as np
import pandas as pd

np.random.seed(42)
random.seed(42)

ISSUE_TYPES = [
    "Pothole",
    "Water Leakage",
    "Garbage Accumulation",
    "Streetlight Failure",
    "Drainage",
    "Road Damage",
    "Other"
]

TRAFFIC_LEVELS = ["Low", "Medium", "High", "Very High"]
POP_DENSITIES = ["Low", "Medium", "High", "Very High"]
WEATHER_FACTORS = ["Clear", "Moderate Rain", "Heavy Rain", "Storm"]

def generate_synthetic_dataset(num_samples=1500, output_path="synthetic_micro_issues.csv"):
    records = []
    scores = []
    
    for i in range(num_samples):
        issue_type = random.choice(ISSUE_TYPES)
        current_severity = random.randint(1, 5) # 1=Minor, 5=Severe
        days_unresolved = random.randint(1, 28)
        nearby_reports = random.randint(0, 20)
        frequency_last_7_days = random.randint(1, 15)
        frequency_change_percentage = round(random.uniform(-40.0, 120.0), 1)
        traffic_level = random.choice(TRAFFIC_LEVELS)
        population_density = random.choice(POP_DENSITIES)
        location_risk_score = random.randint(1, 10)
        historical_escalations = random.randint(0, 8)
        weather_factor = random.choice(WEATHER_FACTORS)
        
        # Domain feature weights
        traffic_weight = {"Low": 1.0, "Medium": 2.0, "High": 3.5, "Very High": 5.0}[traffic_level]
        pop_weight = {"Low": 1.0, "Medium": 2.0, "High": 3.0, "Very High": 4.5}[population_density]
        weather_weight = {"Clear": 1.0, "Moderate Rain": 2.5, "Heavy Rain": 4.0, "Storm": 5.5}[weather_factor]
        
        # Risk index calculation
        score = (
            (current_severity * 8.0) +
            (min(days_unresolved, 20) * 1.5) +
            (nearby_reports * 1.2) +
            (frequency_last_7_days * 1.4) +
            (max(0, frequency_change_percentage) * 0.12) +
            (traffic_weight * 2.5) +
            (pop_weight * 2.2) +
            (location_risk_score * 2.0) +
            (historical_escalations * 2.5) +
            (weather_weight * 2.5)
        )
        
        if issue_type in ["Drainage", "Water Leakage"] and weather_factor in ["Heavy Rain", "Storm"]:
            score += 15.0
        if issue_type in ["Road Damage", "Pothole"] and traffic_level in ["High", "Very High"]:
            score += 12.0
            
        score += random.gauss(0, 3.0)
        scores.append(score)
        
        records.append({
            "record_id": f"REC-{i+1:05d}",
            "issue_type": issue_type,
            "current_severity": current_severity,
            "days_unresolved": days_unresolved,
            "nearby_reports": nearby_reports,
            "frequency_last_7_days": frequency_last_7_days,
            "frequency_change_percentage": frequency_change_percentage,
            "traffic_level": traffic_level,
            "population_density": population_density,
            "location_risk_score": location_risk_score,
            "historical_escalations": historical_escalations,
            "weather_factor": weather_factor,
            "raw_score": score
        })
        
    # Calibrate thresholds using quantiles for realistic balanced distribution
    p25 = np.percentile(scores, 28)
    p60 = np.percentile(scores, 62)
    p85 = np.percentile(scores, 86)
    
    for r in records:
        sc = r["raw_score"]
        if sc >= p85:
            r["priority_level"] = "CRITICAL"
        elif sc >= p60:
            r["priority_level"] = "HIGH"
        elif sc >= p25:
            r["priority_level"] = "MEDIUM"
        else:
            r["priority_level"] = "LOW"
        del r["raw_score"]
        
    df = pd.DataFrame(records)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Dataset generated: {len(df)} records at {output_path}")
    print("Class distribution:")
    print(df['priority_level'].value_counts(normalize=True) * 100)
    print("Counts:")
    print(df['priority_level'].value_counts())
    return df

if __name__ == "__main__":
    out_file = os.path.join(os.path.dirname(__file__), "synthetic_micro_issues.csv")
    generate_synthetic_dataset(1500, out_file)
