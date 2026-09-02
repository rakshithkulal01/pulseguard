import os
import shutil
import numpy as np
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
import scipy.signal

# Global model variable
model = None

# Verified dataset training normalization constants
GLOBAL_MEAN = -0.00037869852
GLOBAL_STD = 0.9833788

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_MODEL_PATH = os.path.join(CURRENT_DIR, "Best_1DCNN.keras")
DEFAULT_ZIP_PATH = os.path.join(CURRENT_DIR, "Best_1DCNN.keras.zip")

FALLBACK_MODEL_PATH = os.path.abspath(os.path.join(CURRENT_DIR, "..", "Best_1DCNN.keras"))
FALLBACK_ZIP_PATH = os.path.abspath(os.path.join(CURRENT_DIR, "..", "Best_1DCNN.keras.zip"))

MODEL_FILE_PATH = os.getenv("MODEL_PATH", DEFAULT_MODEL_PATH)
ZIP_FILE_PATH = os.getenv("ZIP_MODEL_PATH", DEFAULT_ZIP_PATH)

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    import keras
    
    target_path = os.path.abspath(MODEL_FILE_PATH)
    zip_path = os.path.abspath(ZIP_FILE_PATH)
    
    if not os.path.exists(target_path):
        if os.path.exists(zip_path):
            shutil.copyfile(zip_path, target_path)
        elif os.path.exists(FALLBACK_MODEL_PATH):
            target_path = FALLBACK_MODEL_PATH
        elif os.path.exists(FALLBACK_ZIP_PATH):
            shutil.copyfile(FALLBACK_ZIP_PATH, target_path)
        
    if not os.path.exists(target_path):
        raise RuntimeError(f"Keras model file not found at {target_path}")

    try:
        model = keras.models.load_model(target_path)
        print(f"Loaded Keras model successfully from {target_path}")
    except Exception as e:
        print(f"Failed to load Keras model: {e}")
        raise e
        
    yield
    model = None

app = FastAPI(title="PulseGuard ECG 1D-CNN Inference API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": f"Invalid ECG input payload: {exc.errors()}"}
    )

class ECGPredictionRequest(BaseModel):
    samples: List[float] = Field(..., description="Array of exactly 1000 raw ECG sample values")

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "model_loaded": model is not None
    }

def calculate_heart_rate(raw_samples: List[float], sampling_rate: int = 100) -> int:
    try:
        signal = np.array(raw_samples, dtype=np.float32)
        min_distance = int(sampling_rate * 0.4)
        
        norm_sig = (signal - np.mean(signal)) / (np.std(signal) + 1e-8)
        peaks, _ = scipy.signal.find_peaks(norm_sig, height=0.8, distance=min_distance)
        
        num_beats = len(peaks)
        duration_seconds = len(signal) / sampling_rate
        if duration_seconds > 0 and num_beats > 0:
            bpm = int(round((num_beats / duration_seconds) * 60))
            if 40 <= bpm <= 200:
                return bpm
    except Exception:
        pass
    return 75

@app.post("/predict")
async def predict(request: ECGPredictionRequest):
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML Model is not loaded"

        )
    
    samples = request.samples
    
    if len(samples) != 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"ECG input must contain exactly 1000 samples. Received {len(samples)} samples."
        )
        
    try:
        arr = np.array(samples, dtype=np.float32)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ECG samples contain non-numeric values."
        )
        
    if not np.all(np.isfinite(arr)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ECG samples contain infinite or NaN values."
        )

    normalized = (arr - GLOBAL_MEAN) / GLOBAL_STD
    input_data = normalized.reshape(1, 1000, 1)

    try:
        prediction_prob = float(model.predict(input_data, verbose=0)[0][0])
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model prediction failed: {str(e)}"
        )

    is_mi = prediction_prob >= 0.5
    
    if is_mi:
        prediction_label = "MI"
        confidence = float(round(prediction_prob * 100, 1))
        risk_level = "HIGH" if prediction_prob >= 0.7 else "MODERATE"
        summary = "ECG 1D-CNN analysis indicates high probability pattern of Myocardial Infarction."
        key_findings = [
            "Myocardial Infarction pattern detected by 1D-CNN model",
            f"Model MI probability score: {prediction_prob:.4f}"
        ]
    else:
        prediction_label = "NORMAL"
        confidence = float(round((1.0 - prediction_prob) * 100, 1))
        risk_level = "LOW"
        summary = "ECG 1D-CNN analysis indicates normal sinus rhythm pattern."
        key_findings = [
            "Normal ECG pattern detected by 1D-CNN model",
            f"Model normal probability score: {(1.0 - prediction_prob):.4f}"
        ]

    heart_rate = calculate_heart_rate(samples, sampling_rate=100)

    return {
        "prediction": prediction_label,
        "confidence": confidence,
        "riskLevel": risk_level,
        "heartRate": heart_rate,
        "summary": summary,
        "keyFindings": key_findings
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
