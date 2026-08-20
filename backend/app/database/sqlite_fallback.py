import os
import json
import sqlite3
import datetime
from typing import Any, Dict, List, Optional
from database.interface import DatabaseAdapter

class SQLiteFallbackAdapter(DatabaseAdapter):
    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            db_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
            os.makedirs(db_dir, exist_ok=True)
            self.db_path = os.path.join(db_dir, "urbanpulse_local.db")
        else:
            self.db_path = db_path
        self._init_db()

    def _get_conn(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_conn() as conn:
            c = conn.cursor()
            # Tables store doc_id, doc_json, and key indexed columns for fast queries
            c.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE,
                    role TEXT,
                    data TEXT,
                    created_at TIMESTAMP
                )
            """)
            c.execute("""
                CREATE TABLE IF NOT EXISTS reports (
                    report_id TEXT PRIMARY KEY,
                    user_id TEXT,
                    category TEXT,
                    status TEXT,
                    priority TEXT,
                    escalation_probability REAL,
                    location_name TEXT,
                    data TEXT,
                    created_at TIMESTAMP
                )
            """)
            c.execute("""
                CREATE TABLE IF NOT EXISTS predictions (
                    prediction_id TEXT PRIMARY KEY,
                    report_id TEXT,
                    priority TEXT,
                    escalation_probability REAL,
                    data TEXT,
                    created_at TIMESTAMP
                )
            """)
            c.execute("""
                CREATE TABLE IF NOT EXISTS alerts (
                    alert_id TEXT PRIMARY KEY,
                    report_id TEXT,
                    priority TEXT,
                    is_read INTEGER DEFAULT 0,
                    data TEXT,
                    created_at TIMESTAMP
                )
            """)
            c.execute("""
                CREATE TABLE IF NOT EXISTS status_history (
                    id TEXT PRIMARY KEY,
                    report_id TEXT,
                    data TEXT,
                    changed_at TIMESTAMP
                )
            """)
            conn.commit()

    async def connect(self):
        self._init_db()
        return True

    async def disconnect(self):
        pass

    # Users
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        with self._get_conn() as conn:
            c = conn.cursor()
            c.execute("SELECT data FROM users WHERE LOWER(email) = LOWER(?)", (email,))
            row = c.fetchone()
            if row:
                return json.loads(row["data"])
            return None

    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        with self._get_conn() as conn:
            c = conn.cursor()
            c.execute("SELECT data FROM users WHERE id = ?", (user_id,))
            row = c.fetchone()
            if row:
                return json.loads(row["data"])
            return None

    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        with self._get_conn() as conn:
            c = conn.cursor()
            user_id = user_data.get("id")
            email = user_data.get("email")
            role = user_data.get("role", "CITIZEN")
            created_at = user_data.get("created_at", datetime.datetime.utcnow().isoformat())
            data_json = json.dumps(user_data)
            c.execute(
                "INSERT OR REPLACE INTO users (id, email, role, data, created_at) VALUES (?, ?, ?, ?, ?)",
                (user_id, email, role, data_json, created_at)
            )
            conn.commit()
            return user_data

    # Reports
    async def create_report(self, report_data: Dict[str, Any]) -> Dict[str, Any]:
        with self._get_conn() as conn:
            c = conn.cursor()
            rep_id = report_data.get("report_id")
            user_id = report_data.get("user_id")
            category = report_data.get("category")
            status = report_data.get("status", "OPEN")
            priority = report_data.get("priority", "MEDIUM")
            prob = float(report_data.get("escalation_probability", 0.0))
            loc = report_data.get("location_name", "")
            created_at = report_data.get("created_at", datetime.datetime.utcnow().isoformat())
            data_json = json.dumps(report_data)
            c.execute(
                """INSERT OR REPLACE INTO reports 
                   (report_id, user_id, category, status, priority, escalation_probability, location_name, data, created_at) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (rep_id, user_id, category, status, priority, prob, loc, data_json, created_at)
            )
            conn.commit()
            return report_data

    async def get_report_by_id(self, report_id: str) -> Optional[Dict[str, Any]]:
        with self._get_conn() as conn:
            c = conn.cursor()
            c.execute("SELECT data FROM reports WHERE report_id = ?", (report_id,))
            row = c.fetchone()
            if row:
                return json.loads(row["data"])
            return None

    async def get_reports(
        self,
        user_id: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        with self._get_conn() as conn:
            c = conn.cursor()
            query = "SELECT data FROM reports WHERE 1=1"
            params = []
            if user_id:
                query += " AND user_id = ?"
                params.append(user_id)
            if category:
                query += " AND category = ?"
                params.append(category)
            if status:
                query += " AND status = ?"
                params.append(status)
            if priority:
                query += " AND priority = ?"
                params.append(priority)
            query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            c.execute(query, params)
            rows = c.fetchall()
            return [json.loads(r["data"]) for r in rows]

    async def update_report_status(self, report_id: str, new_status: str) -> Optional[Dict[str, Any]]:
        with self._get_conn() as conn:
            c = conn.cursor()
            c.execute("SELECT data FROM reports WHERE report_id = ?", (report_id,))
            row = c.fetchone()
            if not row:
                return None
            doc = json.loads(row["data"])
            doc["status"] = new_status
            doc["updated_at"] = datetime.datetime.utcnow().isoformat()
            data_json = json.dumps(doc)
            c.execute(
                "UPDATE reports SET status = ?, data = ? WHERE report_id = ?",
                (new_status, data_json, report_id)
            )
            conn.commit()
            return doc

    async def count_reports(self, filter_dict: Optional[Dict[str, Any]] = None) -> int:
        with self._get_conn() as conn:
            c = conn.cursor()
            query = "SELECT COUNT(*) as cnt FROM reports WHERE 1=1"
            params = []
            if filter_dict:
                for k, v in filter_dict.items():
                    if k in ["user_id", "category", "status", "priority"]:
                        query += f" AND {k} = ?"
                        params.append(v)
            c.execute(query, params)
            row = c.fetchone()
            return int(row["cnt"]) if row else 0

    # Predictions
    async def create_prediction(self, pred_data: Dict[str, Any]) -> Dict[str, Any]:
        with self._get_conn() as conn:
            c = conn.cursor()
            pred_id = pred_data.get("prediction_id")
            report_id = pred_data.get("report_id")
            priority = pred_data.get("priority", "MEDIUM")
            prob = float(pred_data.get("escalation_probability", 0.0))
            created_at = pred_data.get("created_at", datetime.datetime.utcnow().isoformat())
            data_json = json.dumps(pred_data)
            c.execute(
                "INSERT OR REPLACE INTO predictions (prediction_id, report_id, priority, escalation_probability, data, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (pred_id, report_id, priority, prob, data_json, created_at)
            )
            conn.commit()
            return pred_data

    async def get_prediction_by_report_id(self, report_id: str) -> Optional[Dict[str, Any]]:
        with self._get_conn() as conn:
            c = conn.cursor()
            c.execute("SELECT data FROM predictions WHERE report_id = ? ORDER BY created_at DESC LIMIT 1", (report_id,))
            row = c.fetchone()
            if row:
                return json.loads(row["data"])
            return None

    # Alerts
    async def create_alert(self, alert_data: Dict[str, Any]) -> Dict[str, Any]:
        with self._get_conn() as conn:
            c = conn.cursor()
            alert_id = alert_data.get("alert_id")
            report_id = alert_data.get("report_id")
            priority = alert_data.get("priority", "CRITICAL")
            is_read = 1 if alert_data.get("is_read", False) else 0
            created_at = alert_data.get("created_at", datetime.datetime.utcnow().isoformat())
            data_json = json.dumps(alert_data)
            c.execute(
                "INSERT OR REPLACE INTO alerts (alert_id, report_id, priority, is_read, data, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (alert_id, report_id, priority, is_read, data_json, created_at)
            )
            conn.commit()
            return alert_data

    async def get_alerts(self, is_read: Optional[bool] = None, limit: int = 50) -> List[Dict[str, Any]]:
        with self._get_conn() as conn:
            c = conn.cursor()
            query = "SELECT data FROM alerts WHERE 1=1"
            params = []
            if is_read is not None:
                query += " AND is_read = ?"
                params.append(1 if is_read else 0)
            query += " ORDER BY created_at DESC LIMIT ?"
            params.append(limit)
            c.execute(query, params)
            rows = c.fetchall()
            return [json.loads(r["data"]) for r in rows]

    async def mark_alert_read(self, alert_id: str) -> bool:
        with self._get_conn() as conn:
            c = conn.cursor()
            c.execute("SELECT data FROM alerts WHERE alert_id = ?", (alert_id,))
            row = c.fetchone()
            if not row:
                return False
            doc = json.loads(row["data"])
            doc["is_read"] = True
            data_json = json.dumps(doc)
            c.execute("UPDATE alerts SET is_read = 1, data = ? WHERE alert_id = ?", (data_json, alert_id))
            conn.commit()
            return True

    async def mark_all_alerts_read(self) -> int:
        with self._get_conn() as conn:
            c = conn.cursor()
            c.execute("SELECT alert_id, data FROM alerts WHERE is_read = 0")
            rows = c.fetchall()
            for r in rows:
                doc = json.loads(r["data"])
                doc["is_read"] = True
                c.execute("UPDATE alerts SET is_read = 1, data = ? WHERE alert_id = ?", (json.dumps(doc), r["alert_id"]))
            conn.commit()
            return len(rows)

    # Status History
    async def create_status_history(self, history_data: Dict[str, Any]) -> Dict[str, Any]:
        with self._get_conn() as conn:
            c = conn.cursor()
            h_id = history_data.get("id")
            report_id = history_data.get("report_id")
            changed_at = history_data.get("changed_at", datetime.datetime.utcnow().isoformat())
            data_json = json.dumps(history_data)
            c.execute(
                "INSERT INTO status_history (id, report_id, data, changed_at) VALUES (?, ?, ?, ?)",
                (h_id, report_id, data_json, changed_at)
            )
            conn.commit()
            return history_data

    async def get_status_history_by_report(self, report_id: str) -> List[Dict[str, Any]]:
        with self._get_conn() as conn:
            c = conn.cursor()
            c.execute("SELECT data FROM status_history WHERE report_id = ? ORDER BY changed_at ASC", (report_id,))
            rows = c.fetchall()
            return [json.loads(r["data"]) for r in rows]
