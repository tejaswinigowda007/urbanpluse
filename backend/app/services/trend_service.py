import datetime
from collections import defaultdict
from typing import Dict, Any, List
from database.interface import DatabaseAdapter

class TrendService:
    @staticmethod
    async def get_comprehensive_trends(db: DatabaseAdapter) -> Dict[str, Any]:
        all_reports = await db.get_reports(limit=1000)
        now = datetime.datetime.utcnow()
        
        total_reports = len(all_reports)
        open_issues = sum(1 for r in all_reports if r.get("status") in ["OPEN", "ASSIGNED", "IN PROGRESS"])
        resolved_issues = sum(1 for r in all_reports if r.get("status") == "RESOLVED")
        critical_issues = sum(1 for r in all_reports if r.get("priority") == "CRITICAL" or float(r.get("escalation_probability", 0)) >= 80.0)
        
        avg_risk = round(sum(float(r.get("escalation_probability", 0)) for r in all_reports) / max(1, total_reports), 1)
        
        # Category Aggregation
        cat_counts = defaultdict(int)
        cat_last_7 = defaultdict(int)
        cat_prev_7 = defaultdict(int)
        
        seven_days_ago = now - datetime.timedelta(days=7)
        fourteen_days_ago = now - datetime.timedelta(days=14)
        thirty_days_ago = now - datetime.timedelta(days=30)
        
        # Location Clustering
        loc_groups = defaultdict(list)
        # Severity & Priority distribution
        sev_counts = defaultdict(int)
        prio_counts = defaultdict(int)
        risk_bands = {"0-25% (Low)": 0, "26-50% (Moderate)": 0, "51-75% (Elevated)": 0, "76-100% (Critical)": 0}
        timeline_counts = defaultdict(int)
        
        for r in all_reports:
            cat = r.get("category", "Other")
            cat_counts[cat] += 1
            
            sev = int(r.get("current_severity", 3))
            sev_counts[sev] += 1
            
            prio = r.get("priority", "MEDIUM")
            prio_counts[prio] += 1
            
            prob = float(r.get("escalation_probability", 0.0))
            if prob <= 25.0:
                risk_bands["0-25% (Low)"] += 1
            elif prob <= 50.0:
                risk_bands["26-50% (Moderate)"] += 1
            elif prob <= 75.0:
                risk_bands["51-75% (Elevated)"] += 1
            else:
                risk_bands["76-100% (Critical)"] += 1
                
            loc_name = r.get("location_name", "Bengaluru Central")
            loc_groups[loc_name].append(r)
            
            # Time slicing
            created_at_str = r.get("created_at")
            if created_at_str:
                try:
                    dt = datetime.datetime.fromisoformat(created_at_str.replace("Z", "+00:00")).replace(tzinfo=None)
                    date_key = dt.strftime("%Y-%m-%d")
                    timeline_counts[date_key] += 1
                    
                    if dt >= seven_days_ago:
                        cat_last_7[cat] += 1
                    elif dt >= fourteen_days_ago:
                        cat_prev_7[cat] += 1
                except Exception:
                    pass

        # 1. Reports by Category
        reports_by_category = []
        for cat, cnt in sorted(cat_counts.items(), key=lambda x: x[1], reverse=True):
            pct = round((cnt / max(1, total_reports)) * 100, 1)
            reports_by_category.append({
                "category": cat,
                "count": cnt,
                "percentage": pct
            })
            
        # 2. Location Clusters & High Risk Areas
        reports_by_location = []
        high_risk_areas_count = 0
        
        for loc_name, reports_in_loc in loc_groups.items():
            loc_total = len(reports_in_loc)
            loc_crit = sum(1 for r in reports_in_loc if r.get("priority") == "CRITICAL")
            loc_high = sum(1 for r in reports_in_loc if r.get("priority") == "HIGH")
            loc_avg_prob = round(sum(float(r.get("escalation_probability", 0)) for r in reports_in_loc) / loc_total, 1)
            
            # Dominant category in location
            loc_cats = defaultdict(int)
            for r in reports_in_loc:
                loc_cats[r.get("category", "Other")] += 1
            dominant_cat = max(loc_cats.items(), key=lambda x: x[1])[0] if loc_cats else "General"
            
            # Representative coords
            rep_lat = float(reports_in_loc[0].get("latitude", 12.9716))
            rep_lon = float(reports_in_loc[0].get("longitude", 77.5946))
            
            risk_score_str = "CRITICAL" if loc_avg_prob >= 75 or loc_crit >= 2 else "HIGH" if loc_avg_prob >= 55 else "MEDIUM" if loc_avg_prob >= 35 else "LOW"
            if risk_score_str in ["CRITICAL", "HIGH"]:
                high_risk_areas_count += 1
                
            reports_by_location.append({
                "location_name": loc_name,
                "latitude": rep_lat,
                "longitude": rep_lon,
                "total_reports": loc_total,
                "critical_count": loc_crit,
                "high_count": loc_high,
                "avg_escalation_prob": loc_avg_prob,
                "dominant_category": dominant_cat,
                "risk_score": risk_score_str
            })
            
        reports_by_location.sort(key=lambda x: (x["critical_count"], x["avg_escalation_prob"]), reverse=True)
        
        # 3. Severity Distribution
        severity_distribution = [
            {"severity": f"Severity {s}", "level": s, "count": sev_counts.get(s, 0)}
            for s in range(1, 6)
        ]
        
        # 4. Priority Distribution
        priority_distribution = [
            {"priority": "LOW", "count": prio_counts.get("LOW", 0), "color": "#10b981"},
            {"priority": "MEDIUM", "count": prio_counts.get("MEDIUM", 0), "color": "#f59e0b"},
            {"priority": "HIGH", "count": prio_counts.get("HIGH", 0), "color": "#f97316"},
            {"priority": "CRITICAL", "count": prio_counts.get("CRITICAL", 0), "color": "#ef4444"}
        ]
        
        # 5. Escalation Risk Distribution
        escalation_risk_distribution = [
            {"range": k, "count": v} for k, v in risk_bands.items()
        ]
        
        # 6. Reports Over Time (last 30 days)
        reports_over_time = []
        for i in range(29, -1, -1):
            d = (now - datetime.timedelta(days=i)).strftime("%Y-%m-%d")
            reports_over_time.append({
                "date": d,
                "count": timeline_counts.get(d, 0)
            })
            
        # 7. Category Summary Cards with calculated week-over-week changes
        core_categories = [
            "Pothole",
            "Water Leakage",
            "Garbage Accumulation",
            "Streetlight Failure",
            "Drainage",
            "Road Damage"
        ]
        category_summary_cards = []
        for cat in core_categories:
            cnt = cat_counts.get(cat, 0)
            pct = round((cnt / max(1, total_reports)) * 100, 1)
            last7 = cat_last_7.get(cat, 0)
            prev7 = cat_prev_7.get(cat, 0)
            if prev7 > 0:
                wow_change = round(((last7 - prev7) / prev7) * 100.0, 1)
            else:
                wow_change = round(last7 * 15.0, 1) if last7 > 0 else 0.0
                
            r_level = "CRITICAL" if wow_change >= 40.0 or cnt >= 20 else "HIGH" if wow_change >= 15.0 or cnt >= 12 else "MEDIUM" if cnt >= 5 else "LOW"
            category_summary_cards.append({
                "category": cat,
                "count": cnt,
                "percentage": pct,
                "risk_level": r_level,
                "week_over_week_change": wow_change
            })
            
        # 8. Deterministic Analytical Insights Formulated from Real DB Data
        insights = []
        for loc in reports_by_location[:4]:
            if loc["total_reports"] >= 3:
                insights.append({
                    "id": f"INS-{loc['location_name'][:3].upper()}-01",
                    "category": loc["dominant_category"],
                    "location": loc["location_name"],
                    "headline": f"Cluster Alert: {loc['dominant_category']} concentration in {loc['location_name']}",
                    "description": f"{loc['dominant_category']} reports in {loc['location_name']} represent {loc['total_reports']} active cases ({loc['critical_count']} Critical, {loc['high_count']} High) with an average escalation probability of {loc['avg_escalation_prob']}%.",
                    "escalation_risk": loc["risk_score"],
                    "recommended_action": f"Schedule immediate municipal inspection and deploy zonal task force for {loc['dominant_category']} mitigation at {loc['location_name']}.",
                    "percentage_change": round(loc["avg_escalation_prob"], 1),
                    "timestamp": now.isoformat()
                })
                
        for card in category_summary_cards:
            if card["week_over_week_change"] > 10.0 and len(insights) < 6:
                insights.append({
                    "id": f"INS-{card['category'][:3].upper()}-WOW",
                    "category": card["category"],
                    "location": "Citywide",
                    "headline": f"Frequency Surge: {card['category']} up by {card['week_over_week_change']}%",
                    "description": f"Reports of {card['category']} increased by {card['week_over_week_change']}% compared with the previous 7-day period (Total: {card['count']} reports).",
                    "escalation_risk": card["risk_level"],
                    "recommended_action": f"Alert sanitation and civil engineering departments to expand preventive maintenance shifts.",
                    "percentage_change": card["week_over_week_change"],
                    "timestamp": now.isoformat()
                })

        return {
            "kpis": {
                "total_reports": total_reports,
                "open_issues": open_issues,
                "critical_issues": critical_issues,
                "resolved_issues": resolved_issues,
                "high_risk_areas_count": high_risk_areas_count,
                "average_escalation_risk": avg_risk
            },
            "reports_by_category": reports_by_category,
            "reports_by_location": reports_by_location,
            "severity_distribution": severity_distribution,
            "priority_distribution": priority_distribution,
            "escalation_risk_distribution": escalation_risk_distribution,
            "reports_over_time": reports_over_time,
            "category_summary_cards": category_summary_cards,
            "deterministic_insights": insights
        }
