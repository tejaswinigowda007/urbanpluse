from typing import List, Optional
from database.interface import DatabaseAdapter

class AlertService:
    @staticmethod
    async def get_alerts(db: DatabaseAdapter, is_read: Optional[bool] = None, limit: int = 50) -> List[dict]:
        return await db.get_alerts(is_read=is_read, limit=limit)

    @staticmethod
    async def mark_read(db: DatabaseAdapter, alert_id: str) -> bool:
        return await db.mark_alert_read(alert_id)

    @staticmethod
    async def mark_all_read(db: DatabaseAdapter) -> int:
        return await db.mark_all_alerts_read()
