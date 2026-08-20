import os
import sys
import uuid
import random
import asyncio
import datetime

# Add paths
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "app")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ml")))

from database.connection import init_database
from services.ml_service import extract_features_from_report, run_ml_prediction

DEMO_HUBS = [
    {
        "location_name": "Bannerghatta Road",
        "lat": 12.8988,
        "lon": 77.5998,
        "primary_cat": "Pothole",
        "desc_templates": [
            "Deep pothole near Vega City Mall causing severe traffic slow-down and two-wheeler skidding risk.",
            "Crater-sized road depression near Jayadeva underpass after recent pipeline excavation.",
            "Multiple progressive potholes near Arekere gate expanding due to heavy bus movement.",
            "Asphalt breakdown and exposed gravel near Bilekahalli junction.",
            "Sunken manhole frame creating dangerous 4-inch drop for vehicles."
        ],
        "severity_range": (3, 5),
        "days_range": (3, 14),
        "traffic": "Very High"
    },
    {
        "location_name": "BTM Layout",
        "lat": 12.9166,
        "lon": 77.6101,
        "primary_cat": "Garbage Accumulation",
        "desc_templates": [
            "Overflowing public waste bins near 16th Main commercial strip attracting stray animals.",
            "Solid waste dumped on sidewalk near Udupi Garden junction blocking pedestrian path.",
            "Commercial food waste piles accumulating near 7th Cross road for over 5 days.",
            "Uncollected domestic waste sacks piled at secondary junction corner.",
            "Plastic and dry waste overflowing onto roadway near residential pocket."
        ],
        "severity_range": (2, 4),
        "days_range": (2, 8),
        "traffic": "High"
    },
    {
        "location_name": "JP Nagar",
        "lat": 12.9063,
        "lon": 77.5857,
        "primary_cat": "Water Leakage",
        "desc_templates": [
            "Potable water supply line leaking near 6th Phase junction, creating road ponding.",
            "Underground pipe breach with continuous water loss near 24th Main park corner.",
            "Sub-surface water leakage softening road asphalt near 15th Cross road.",
            "Valve leakage overflowing into roadside drain during morning supply hours.",
            "Freshwater puddle forming daily due to cracked municipal conduit."
        ],
        "severity_range": (2, 5),
        "days_range": (2, 10),
        "traffic": "Medium"
    },
    {
        "location_name": "Jayanagar",
        "lat": 12.9308,
        "lon": 77.5838,
        "primary_cat": "Streetlight Failure",
        "desc_templates": [
            "Array of 4 consecutive LED streetlights non-functional along 4th Block 11th Main.",
            "Flickering sodium vapor streetlight creating blind spot near residential crossing.",
            "Broken pole fixture with dangling electrical wire near 3rd Block commercial complex.",
            "Dark street segment near Madhavan Park due to underground cable failure.",
            "Streetlight timer malfunction remaining off during night hours."
        ],
        "severity_range": (2, 4),
        "days_range": (1, 7),
        "traffic": "Medium"
    },
    {
        "location_name": "Electronic City",
        "lat": 12.8452,
        "lon": 77.6602,
        "primary_cat": "Road Damage",
        "desc_templates": [
            "Severe asphalt shear and rutting near Phase 1 toll gate creating hazardous vehicle swerve.",
            "Longitudinal road crack expanding along heavy freight transit lane.",
            "Cracked concrete road slab near tech park entry gate causing wheel damage.",
            "Erosion of road shoulder along peripheral service lane.",
            "Deep surface depression forming near storm drain culvert on main access corridor."
        ],
        "severity_range": (3, 5),
        "days_range": (4, 18),
        "traffic": "Very High"
    },
    {
        "location_name": "Koramangala",
        "lat": 12.9352,
        "lon": 77.6245,
        "primary_cat": "Drainage",
        "desc_templates": [
            "Stormwater drain choked with silt and plastic debris near 5th Block Sony World signal.",
            "Sewer overflow onto service road during moderate rainfall near 4th Block.",
            "Broken stormwater grate posing hazard for pedestrians and cyclists.",
            "Blocked culvert causing wastewater backup into nearby residential basement ramps.",
            "Open drain slab missing near 80 Feet Road bus stop."
        ],
        "severity_range": (3, 5),
        "days_range": (3, 12),
        "traffic": "High"
    },
    {
        "location_name": "HSR Layout",
        "lat": 12.9121,
        "lon": 77.6446,
        "primary_cat": "Pothole",
        "desc_templates": [
            "Cluster of three potholes near Sector 2 27th Main arterial road.",
            "Deep road trench left unpaved after fiber optic cable laying near Sector 1.",
            "Loose bitumen and gravel causing skid hazard near Sector 4 commercial corner.",
            "Surface pit near 19th Main intersection causing sudden braking by commuter vehicles.",
            "Eroded road patch expanding across both lanes near Sector 7."
        ],
        "severity_range": (2, 4),
        "days_range": (2, 9),
        "traffic": "High"
    }
]

OTHER_LOCATIONS = [
    ("Indiranagar 100 Feet Road", 12.9784, 77.6408, "Garbage Accumulation"),
    ("Whitefield Main Road", 12.9698, 77.7499, "Road Damage"),
    ("Malleshwaram 8th Cross", 13.0031, 77.5702, "Drainage"),
    ("MG Road Metro Corridor", 12.9756, 77.6066, "Streetlight Failure"),
    ("Rajajinagar 1st Block", 12.9982, 77.5530, "Water Leakage")
]

async def seed_data():
    db = await init_database()
    print("Database connected. Seeding realistic Bengaluru demo reports...")
    
    # Check if reports already exist
    existing_count = await db.count_reports()
    if existing_count >= 50:
        print(f"Database already contains {existing_count} reports. Seeding skipped.")
        return
        
    random.seed(42)
    now = datetime.datetime.utcnow()
    created_reports = []
    
    # 1. Generate cluster reports for main hubs (approx 10 reports per hub = 70 reports)
    for hub in DEMO_HUBS:
        num_reports = random.randint(8, 12)
        for i in range(num_reports):
            rep_id = f"REP-{uuid.uuid4().hex[:8].upper()}"
            cat = hub["primary_cat"] if random.random() < 0.75 else random.choice(["Pothole", "Water Leakage", "Drainage", "Streetlight Failure", "Garbage Accumulation"])
            desc = random.choice(hub["desc_templates"])
            title = f"{cat} near {hub['location_name']}"
            
            # Slight coordinate jitter within ~800m
            lat_jitter = random.uniform(-0.007, 0.007)
            lon_jitter = random.uniform(-0.007, 0.007)
            lat = round(hub["lat"] + lat_jitter, 6)
            lon = round(hub["lon"] + lon_jitter, 6)
            
            severity = random.randint(hub["severity_range"][0], hub["severity_range"][1])
            days_unresolved = random.randint(hub["days_range"][0], hub["days_range"][1])
            
            # Stagger creation timestamps over last 25 days
            days_ago = random.randint(0, 25)
            hours_ago = random.randint(0, 23)
            created_dt = now - datetime.timedelta(days=days_ago, hours=hours_ago)
            created_at_str = created_dt.isoformat()
            
            # Status distribution
            if days_ago > 15 and random.random() < 0.65:
                status = "RESOLVED"
            elif days_ago > 7 and random.random() < 0.45:
                status = random.choice(["ASSIGNED", "IN PROGRESS"])
            else:
                status = "OPEN"
                
            report_dict = {
                "title": title,
                "category": cat,
                "location_name": hub["location_name"],
                "latitude": lat,
                "longitude": lon,
                "description": desc,
                "current_severity": severity,
                "days_unresolved": days_unresolved,
                "traffic_level": hub["traffic"],
                "weather_factor": random.choice(["Clear", "Moderate Rain", "Heavy Rain"]) if cat in ["Drainage", "Water Leakage"] else "Clear"
            }
            
            # Extract ML features using existing seed reports
            features = extract_features_from_report(report_dict, created_reports)
            prediction = run_ml_prediction(features)
            
            escalation_prob = prediction["escalation_probability"]
            priority = prediction["priority"]
            risk_factors = prediction["risk_factors"]
            rec_action = prediction["recommended_action"]
            
            doc = {
                "report_id": rep_id,
                "user_id": "USR-DEMO-CITIZEN",
                "reporter_name": "Citizen Reporter",
                "title": title,
                "category": cat,
                "location_name": hub["location_name"],
                "latitude": lat,
                "longitude": lon,
                "description": desc,
                "current_severity": severity,
                "days_unresolved": days_unresolved,
                "image_url": None,
                "status": status,
                "escalation_probability": escalation_prob,
                "priority": priority,
                "risk_factors": risk_factors,
                "recommended_action": rec_action,
                "created_at": created_at_str,
                "updated_at": created_at_str
            }
            
            await db.create_report(doc)
            created_reports.append(doc)
            
            # Store prediction
            pred_id = f"PRED-{uuid.uuid4().hex[:8].upper()}"
            pred_doc = {
                "prediction_id": pred_id,
                "report_id": rep_id,
                "escalation_probability": escalation_prob,
                "priority": priority,
                "confidence": prediction["confidence"],
                "estimated_escalation_days": prediction["estimated_escalation_days"],
                "risk_factors": risk_factors,
                "recommended_action": rec_action,
                "model_name": prediction["model_name"],
                "created_at": created_at_str
            }
            await db.create_prediction(pred_doc)
            
            # Create Alert if critical or >= 80%
            if (escalation_prob >= 80.0 or priority == "CRITICAL") and status != "RESOLVED":
                alert_id = f"ALT-{uuid.uuid4().hex[:8].upper()}"
                alert_doc = {
                    "alert_id": alert_id,
                    "report_id": rep_id,
                    "alert_type": "CRITICAL_ESCALATION",
                    "message": f"Critical risk alert: {cat} at {hub['location_name']} (Risk: {escalation_prob}%).",
                    "priority": priority,
                    "escalation_probability": escalation_prob,
                    "location_name": hub["location_name"],
                    "category": cat,
                    "risk_factors": risk_factors,
                    "recommended_action": rec_action,
                    "is_read": random.choice([True, False]),
                    "created_at": created_at_str
                }
                await db.create_alert(alert_doc)
                
            # Create initial status history
            hist_id = f"HIST-{uuid.uuid4().hex[:8].upper()}"
            hist_doc = {
                "id": hist_id,
                "report_id": rep_id,
                "old_status": "NONE",
                "new_status": "OPEN",
                "changed_by": "USR-DEMO-CITIZEN",
                "changed_by_name": "Citizen Reporter",
                "notes": "Initial citizen issue report registered.",
                "changed_at": created_at_str
            }
            await db.create_status_history(hist_doc)
            
            # If resolved/in progress, add transition history
            if status in ["IN PROGRESS", "RESOLVED"]:
                mid_dt = created_dt + datetime.timedelta(days=min(3, days_ago))
                await db.create_status_history({
                    "id": f"HIST-{uuid.uuid4().hex[:8].upper()}",
                    "report_id": rep_id,
                    "old_status": "OPEN",
                    "new_status": "IN PROGRESS",
                    "changed_by": "USR-DEMO-AUTHORITY",
                    "changed_by_name": "Zonal Municipal Engineer",
                    "notes": "Field inspection conducted and maintenance team dispatched.",
                    "changed_at": mid_dt.isoformat()
                })
            if status == "RESOLVED":
                res_dt = created_dt + datetime.timedelta(days=min(6, days_ago))
                await db.create_status_history({
                    "id": f"HIST-{uuid.uuid4().hex[:8].upper()}",
                    "report_id": rep_id,
                    "old_status": "IN PROGRESS",
                    "new_status": "RESOLVED",
                    "changed_by": "USR-DEMO-AUTHORITY",
                    "changed_by_name": "Smart City Operations Desk",
                    "notes": "Physical repairs completed, quality inspection verified, and issue closed.",
                    "changed_at": res_dt.isoformat()
                })

    # 2. Add extra reports in other locations
    for loc_name, lat, lon, cat in OTHER_LOCATIONS:
        for _ in range(2):
            rep_id = f"REP-{uuid.uuid4().hex[:8].upper()}"
            created_dt = now - datetime.timedelta(days=random.randint(1, 10))
            created_at_str = created_dt.isoformat()
            sev = random.randint(2, 4)
            days = random.randint(1, 6)
            
            report_dict = {
                "title": f"{cat} incident at {loc_name}",
                "category": cat,
                "location_name": loc_name,
                "latitude": lat,
                "longitude": lon,
                "description": f"Reported {cat.lower()} causing localized disruption near {loc_name}.",
                "current_severity": sev,
                "days_unresolved": days
            }
            features = extract_features_from_report(report_dict, created_reports)
            prediction = run_ml_prediction(features)
            
            doc = {
                "report_id": rep_id,
                "user_id": "USR-DEMO-CITIZEN",
                "reporter_name": "Arjun Sharma",
                "title": f"{cat} incident at {loc_name}",
                "category": cat,
                "location_name": loc_name,
                "latitude": lat,
                "longitude": lon,
                "description": f"Reported {cat.lower()} causing localized disruption near {loc_name}.",
                "current_severity": sev,
                "days_unresolved": days,
                "image_url": None,
                "status": "OPEN",
                "escalation_probability": prediction["escalation_probability"],
                "priority": prediction["priority"],
                "risk_factors": prediction["risk_factors"],
                "recommended_action": prediction["recommended_action"],
                "created_at": created_at_str,
                "updated_at": created_at_str
            }
            await db.create_report(doc)
            created_reports.append(doc)
            
            await db.create_prediction({
                "prediction_id": f"PRED-{uuid.uuid4().hex[:8].upper()}",
                "report_id": rep_id,
                "escalation_probability": prediction["escalation_probability"],
                "priority": prediction["priority"],
                "confidence": prediction["confidence"],
                "estimated_escalation_days": prediction["estimated_escalation_days"],
                "risk_factors": prediction["risk_factors"],
                "recommended_action": prediction["recommended_action"],
                "model_name": prediction["model_name"],
                "created_at": created_at_str
            })

    print(f"Successfully seeded {len(created_reports)} realistic Bengaluru demo reports with full ML escalation predictions!")

if __name__ == "__main__":
    asyncio.run(seed_data())
