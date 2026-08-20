from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

class DatabaseAdapter(ABC):
    @abstractmethod
    async def connect(self):
        pass

    @abstractmethod
    async def disconnect(self):
        pass

    # Users
    @abstractmethod
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    # Reports
    @abstractmethod
    async def create_report(self, report_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_report_by_id(self, report_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_reports(
        self,
        user_id: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def update_report_status(self, report_id: str, new_status: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def count_reports(self, filter_dict: Optional[Dict[str, Any]] = None) -> int:
        pass

    # Predictions
    @abstractmethod
    async def create_prediction(self, pred_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_prediction_by_report_id(self, report_id: str) -> Optional[Dict[str, Any]]:
        pass

    # Alerts
    @abstractmethod
    async def create_alert(self, alert_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_alerts(self, is_read: Optional[bool] = None, limit: int = 50) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def mark_alert_read(self, alert_id: str) -> bool:
        pass

    @abstractmethod
    async def mark_all_alerts_read(self) -> int:
        pass

    # Status History
    @abstractmethod
    async def create_status_history(self, history_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_status_history_by_report(self, report_id: str) -> List[Dict[str, Any]]:
        pass
