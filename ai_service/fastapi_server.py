import os
import zipfile
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

# Decision threshold as confirmed by ML training pipeline
MI_THRESHOLD = 0.7

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_MODEL_PATH = os.path.join(CURRENT_DIR, "Best_1DCNN.keras")
DEFAULT_EXTRACTED_DIR = os.path.join(CURRENT_DIR, "Best_1DCNN_extracted")
DEFAULT_ZIP_PATH = os.path.join(CURRENT_DIR, "Best_1DCNN.keras.zip")

FALLBACK_MODEL_PATH = os.path.abspath(os.path.join(CURRENT_DIR, "..", "Best_1DCNN.keras"))
FALLBACK_ZIP_PATH = os.path.abspath(os.path.join(CURRENT_DIR, "..", "Best_1DCNN.keras.zip"))

MODEL_FILE_PATH = os.getenv("MODEL_PATH", DEFAULT_MODEL_PATH)
ZIP_FILE_PATH = os.getenv("ZIP_MODEL_PATH", DEFAULT_ZIP_PATH)

def calculate_st_feature(norm_signal: np.ndarray, sampling_rate: int = 100) -> float:
    """
    Computes the ST-segment elevation/depression feature from a normalized ECG signal.
    Measures the difference between the ST point (100ms after R-peak)
    and the isoelectric PR baseline (120ms before R-peak).
    Returns 0.0 (isoelectric baseline) if insufficient clean peaks are detected.
    """
    try:
        min_distance = int(sampling_rate * 0.4)
        peaks, _ = scipy.signal.find_peaks(norm_signal, height=0.8, distance=min_distance)
        if len(peaks) < 2:
            return 0.0
        st_measurements = []
        for r in peaks:
            st_sample = r + int(0.10 * sampling_rate)
            base_sample = r - int(0.12 * sampling_rate)
            if 0 <= base_sample < len(norm_signal) and 0 <= st_sample < len(norm_signal):
                st_measurements.append(float(norm_signal[st_sample] - norm_signal[base_sample]))
        if st_measurements:
            return float(np.median(st_measurements))
    except Exception:
        pass
    return 0.0

def execute_model_prediction(model_instance, ecg_tensor: np.ndarray, st_value: float = 0.0) -> float:
    """
    Executes model prediction adaptively handling:
    - Multi-input models (e.g. ecg_input + st_input)
    - Single-input models (e.g. (1, 1000, 1))
    """
    is_multi_input = isinstance(model_instance.input_shape, list) and len(model_instance.input_shape) > 1
    if is_multi_input:
        st_arr = np.array([[st_value]], dtype=np.float32)
        try:
            feed = {"ecg_input": ecg_tensor, "st_input": st_arr}
            pred_output = model_instance.predict(feed, verbose=0)
        except Exception:
            feed = [ecg_tensor, st_arr]
            pred_output = model_instance.predict(feed, verbose=0)
    else:
        pred_output = model_instance.predict(ecg_tensor, verbose=0)
    return float(np.squeeze(pred_output).item())

def load_or_extract_model():
    """
    Safely loads the Keras 1D-CNN model.
    1. If a valid .keras file or model directory already exists, loads and validates it.
    2. If not, inspects ZIP archives (without renaming/corrupting files).
    3. If the ZIP contains a .keras file inside, extracts that file.
    4. If the ZIP contains unzipped components (config.json, metadata.json, model.weights.h5),
       copies or extracts them into a valid .keras target and loads it.
    5. Validates the model by running a dummy forward pass before returning.
    """
    import keras
    import shutil

    # Check candidates for already-existing model file or directory
    candidates = [MODEL_FILE_PATH, DEFAULT_EXTRACTED_DIR, FALLBACK_MODEL_PATH]
    for candidate in candidates:
        if os.path.exists(candidate):
            try:
                loaded = keras.models.load_model(candidate)
                # Verify with a dummy forward pass
                dummy = np.zeros((1, 1000, 1), dtype=np.float32)
                execute_model_prediction(loaded, dummy, 0.0)
                print(f"Loaded and verified Keras model successfully from {candidate}")
                return loaded
            except Exception as e:
                print(f"Could not load existing candidate {candidate}: {e}")

    # If not yet loaded, look for available ZIP archive
    zip_candidates = [
        ZIP_FILE_PATH,
        FALLBACK_ZIP_PATH,
        os.path.join(CURRENT_DIR, "Best_1DCNN(2).keras.zip"),
        os.path.abspath(os.path.join(CURRENT_DIR, "..", "Best_1DCNN(2).keras.zip"))
    ]
    chosen_zip = None
    for zc in zip_candidates:
        if os.path.exists(zc):
            chosen_zip = zc
            break

    if not chosen_zip:
        raise RuntimeError(
            f"Neither valid Keras model ({MODEL_FILE_PATH}) nor source ZIP archive ({ZIP_FILE_PATH}) found."
        )

    print(f"Inspecting and extracting model from ZIP archive: {chosen_zip}")
    with zipfile.ZipFile(chosen_zip, "r") as z:
        namelist = z.namelist()
        keras_files = [f for f in namelist if f.endswith(".keras")]
        
        if keras_files:
            # Archive contains an inner .keras file -> extract it
            target_file = keras_files[0]
            print(f"Extracting inner {target_file} from {chosen_zip} to {MODEL_FILE_PATH}")
            z.extract(target_file, CURRENT_DIR)
            extracted_target = os.path.join(CURRENT_DIR, target_file)
            loaded = keras.models.load_model(extracted_target)
        else:
            # Keras 3 zip archive (contains config.json, metadata.json, model.weights.h5)
            # Copy to .keras file directly so Keras 3 can load it
            print(f"Deploying Keras model archive {chosen_zip} to {MODEL_FILE_PATH}")
            shutil.copyfile(chosen_zip, MODEL_FILE_PATH)
            loaded = keras.models.load_model(MODEL_FILE_PATH)

    # Validate loaded model
    dummy = np.zeros((1, 1000, 1), dtype=np.float32)
    execute_model_prediction(loaded, dummy, 0.0)
    print("Model validation forward pass succeeded.")
    return loaded

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    try:
        model = load_or_extract_model()
    except Exception as e:
        print(f"Failed to load Keras model during startup: {e}")
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
    
    # 1. Input length validation
    if len(samples) != 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"ECG input must contain exactly 1000 samples. Received {len(samples)} samples."
        )
        
    # 2. Numeric and finite validation
    try:
        arr = np.asarray(samples, dtype=np.float32)
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

    # 3. Flatline / constant signal check
    mean = float(np.mean(arr))
    std = float(np.std(arr))

    if std < 1e-8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient ECG signal variation (flatline or constant signal)."
        )

    # 4. Per-ECG Z-score normalization: (samples - mean) / std
    normalized = (arr - mean) / std
    input_data = normalized.reshape(1, 1000, 1)

    # 5. Extract ST feature and execute model forward pass
    st_feature = calculate_st_feature(normalized, sampling_rate=100)
    try:
        prediction_prob = execute_model_prediction(model, input_data, st_feature)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model prediction failed: {str(e)}"
        )

    if not np.isfinite(prediction_prob) or not (0.0 <= prediction_prob <= 1.0):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Model output probability is out of valid range [0, 1]."
        )

    # 6. Diagnostic stats for debugging hardware signal vs model behavior
    raw_min = float(np.min(arr))
    raw_max = float(np.max(arr))
    norm_min = float(np.min(normalized))
    norm_max = float(np.max(normalized))
    norm_mean = float(np.mean(normalized))
    norm_std = float(np.std(normalized))

    print(f"[ECG Inference] Raw: min={raw_min:.2f}, max={raw_max:.2f}, mean={mean:.2f}, std={std:.2f}")
    print(f"[ECG Inference] Normalized: min={norm_min:.2f}, max={norm_max:.2f}, mean={norm_mean:.4f}, std={norm_std:.4f}")
    print(f"[ECG Inference] Model: input_shape={getattr(model, 'input_shape', None)}, ST_feature={st_feature:.4f}, probability={prediction_prob:.4f}")

    # 7. Decision threshold: 0.7 everywhere
    is_mi = prediction_prob >= MI_THRESHOLD
    
    if is_mi:
        prediction_label = "MI"
        confidence = float(round(prediction_prob * 100, 1))
        risk_level = "HIGH"
        summary = "ECG 1D-CNN analysis indicates high probability pattern of Myocardial Infarction."
        key_findings = [
            "Myocardial Infarction pattern detected by 1D-CNN model",
            f"Model MI probability score: {prediction_prob:.4f} (threshold >= {MI_THRESHOLD})"
        ]
    else:
        prediction_label = "NORMAL"
        confidence = float(round((1.0 - prediction_prob) * 100, 1))
        risk_level = "LOW"
        summary = "ECG 1D-CNN analysis indicates normal sinus rhythm pattern."
        key_findings = [
            "Normal ECG pattern detected by 1D-CNN model",
            f"Model normal probability score: {(1.0 - prediction_prob):.4f} (threshold < {MI_THRESHOLD})"
        ]

    # 8. Heart rate calculation
    heart_rate = calculate_heart_rate(samples, sampling_rate=100)

    # 9. Return backward-compatible response with debug diagnostics
    return {
        "prediction": prediction_label,
        "confidence": confidence,
        "riskLevel": risk_level,
        "heartRate": heart_rate,
        "summary": summary,
        "keyFindings": key_findings,
        "probability": float(round(prediction_prob, 4)),
        "diagnostics": {
            "inputMean": float(round(mean, 2)),
            "inputStd": float(round(std, 2)),
            "normalizedMean": float(round(norm_mean, 4)),
            "normalizedStd": float(round(norm_std, 4)),
            "stFeature": float(round(st_feature, 4))
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
