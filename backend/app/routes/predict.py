from fastapi import APIRouter, HTTPException, status
from models.schemas import PredictRequest, PredictResponse
from services.ml_service import run_ml_prediction

router = APIRouter(prefix="/api/predict", tags=["Machine Learning Inference"])

@router.post("", response_model=PredictResponse)
async def predict_endpoint(req: PredictRequest):
    try:
        feature_dict = req.dict()
        result = run_ml_prediction(feature_dict)
        return PredictResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ML Prediction failed: {str(e)}"
        )
