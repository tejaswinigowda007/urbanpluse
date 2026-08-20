import os
import json
from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/api/ml", tags=["Machine Learning Performance"])

@router.get("/performance")
async def get_ml_performance():
    metrics_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "models", "metrics.json")
    )
    if not os.path.exists(metrics_path):
        # Trigger training if not found
        try:
            from ml.train_model import train_and_evaluate
            return train_and_evaluate()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Could not load ML performance metrics: {str(e)}"
            )
            
    try:
        with open(metrics_path, "r") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reading metrics: {str(e)}"
        )
