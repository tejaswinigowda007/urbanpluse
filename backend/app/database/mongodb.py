import os
import datetime
from typing import Any, Dict, List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from database.interface import DatabaseAdapter

class MongoDBAdapter(DatabaseAdapter):
    def __init__(self, uri: str = "mongodb://localhost:27017", db_name: str = "urbanpulse"):
        self.uri = uri
        self.db_name = db_name
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None

    async def connect(self):
        self.client = AsyncIOMotorClient(self.uri, serverSelectionTimeoutMS=2000)
        self.db = self.client[self.db_name]
        # Quick ping to verify
        await self.client.admin.command('ping')
        return True

    async def disconnect(self):
        if self.client:
            self.client.close()

    # Users
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        user = await self.db.users.find_one({"email": {"$regex": f"^{email}$", "$options": "i"}})
        if user and "_id" in user:
            del user["_id"]
        return user

    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        user = await self.db.users.find_one({"id": user_id})
        if user and "_id" in user:
            del user["_id"]
        return user

    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        data = dict(user_data)
        await self.db.users.replace_one({"id": data["id"]}, data, upsert=True)
        return user_data

    # Reports
    async def create_report(self, report_data: Dict[str, Any]) -> Dict[str, Any]:
        data = dict(report_data)
        await self.db.reports.replace_one({"report_id": data["report_id"]}, data, upsert=True)
        return report_data

    async def get_report_by_id(self, report_id: str) -> Optional[Dict[str, Any]]:
        rep = await self.db.reports.find_one({"report_id": report_id})
        if rep and "_id" in rep:
            del rep["_id"]
        return rep

    async def get_reports(
        self,
        user_id: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        q = {}
        if user_id:
            q["user_id"] = user_id
        if category:
            q["category"] = category
        if status:
            q["status"] = status
        if priority:
            q["priority"] = priority
            
        cursor = self.db.reports.find(q).sort("created_at", -1).skip(offset).limit(limit)
        results = []
        async for doc in cursor:
            if "_id" in doc:
                del doc["_id"]
            results.append(doc)
        return results

    async def update_report_status(self, report_id: str, new_status: str) -> Optional[Dict[str, Any]]:
        now = datetime.datetime.utcnow().isoformat()
        res = await self.db.reports.find_one_and_update(
            {"report_id": report_id},
            {"$set": {"status": new_status, "updated_at": now}},
            return_document=True
        )
        if res and "_id" in res:
            del res["_id"]
        return res

    async def count_reports(self, filter_dict: Optional[Dict[str, Any]] = None) -> int:
        q = filter_dict or {}
        return await self.db.reports.count_documents(q)

    # Predictions
    async def create_prediction(self, pred_data: Dict[str, Any]) -> Dict[str, Any]:
        data = dict(pred_data)
        await self.db.predictions.replace_one({"prediction_id": data["prediction_id"]}, data, upsert=True)
        return pred_data

    async def get_prediction_by_report_id(self, report_id: str) -> Optional[Dict[str, Any]]:
        doc = await self.db.predictions.find_one({"report_id": report_id}, sort=[("created_at", -1)])
        if doc and "_id" in doc:
            del doc["_id"]
        return doc

    # Alerts
    async def create_alert(self, alert_data: Dict[str, Any]) -> Dict[str, Any]:
        data = dict(alert_data)
        await self.db.alerts.replace_one({"alert_id": data["alert_id"]}, data, upsert=True)
        return alert_data

    async def get_alerts(self, is_read: Optional[bool] = None, limit: int = 50) -> List[Dict[str, Any]]:
        q = {}
        if is_read is not None:
            q["is_read"] = is_read
        cursor = self.db.alerts.find(q).sort("created_at", -1).limit(limit)
        results = []
        async for doc in cursor:
            if "_id" in doc:
                del doc["_id"]
            results.append(doc)
        return results

    async def mark_alert_read(self, alert_id: str) -> bool:
        res = await self.db.alerts.update_one({"alert_id": alert_id}, {"$set": {"is_read": True}})
        return res.modified_count > 0

    async def mark_all_alerts_read(self) -> int:
        res = await self.db.alerts.update_many({"is_read": False}, {"$set": {"is_read": True}})
        return res.modified_count

    # Status History
    async def create_status_history(self, history_data: Dict[str, Any]) -> Dict[str, Any]:
        data = dict(history_data)
        await self.db.status_history.insert_one(data)
        if "_id" in data:
            del data["_id"]
        return data

    async def get_status_history_by_report(self, report_id: str) -> List[Dict[str, Any]]:
        cursor = self.db.status_history.find({"report_id": report_id}).sort("changed_at", 1)
        results = []
        async for doc in cursor:
            if "_id" in doc:
                del doc["_id"]
            results.append(doc)
        return results
