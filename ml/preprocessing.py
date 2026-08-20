import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler

CATEGORICAL_COLS = ["issue_type", "traffic_level", "population_density", "weather_factor"]
NUMERICAL_COLS = [
    "current_severity",
    "days_unresolved",
    "nearby_reports",
    "frequency_last_7_days",
    "frequency_change_percentage",
    "location_risk_score",
    "historical_escalations"
]

PRIORITY_MAPPING = {
    "LOW": 0,
    "MEDIUM": 1,
    "HIGH": 2,
    "CRITICAL": 3
}
REVERSE_PRIORITY_MAPPING = {v: k for k, v in PRIORITY_MAPPING.items()}

class UrbanPulsePreprocessor:
    def __init__(self):
        self.encoders = {}
        self.scaler = StandardScaler()
        self.feature_names = []

    def fit(self, df: pd.DataFrame):
        for col in CATEGORICAL_COLS:
            le = LabelEncoder()
            le.fit(df[col].astype(str))
            self.encoders[col] = le
            
        # Fit scaler on numerical cols
        self.scaler.fit(df[NUMERICAL_COLS])
        self.feature_names = CATEGORICAL_COLS + NUMERICAL_COLS
        return self

    def transform(self, df: pd.DataFrame) -> np.ndarray:
        df_copy = df.copy()
        
        # Encode categoricals with fallback for unseen categories
        cat_data = []
        for col in CATEGORICAL_COLS:
            le = self.encoders[col]
            # Replace unknown classes with first class
            val_series = df_copy[col].astype(str).map(
                lambda s: s if s in le.classes_ else le.classes_[0]
            )
            cat_data.append(le.transform(val_series))
            
        cat_array = np.column_stack(cat_data)
        num_array = self.scaler.transform(df_copy[NUMERICAL_COLS])
        
        return np.hstack([cat_array, num_array])

    def fit_transform(self, df: pd.DataFrame) -> np.ndarray:
        self.fit(df)
        return self.transform(df)

    def transform_single(self, feature_dict: dict) -> np.ndarray:
        df = pd.DataFrame([feature_dict])
        return self.transform(df)
