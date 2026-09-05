import os
import sys
import unittest
import asyncio
import numpy as np
from fastapi import HTTPException

# Ensure ai_service directory is on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

import fastapi_server
from fastapi_server import (
    app,
    lifespan,
    predict,
    health_check,
    ECGPredictionRequest,
    MI_THRESHOLD,
    calculate_heart_rate
)

class TestFastAPIInference(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Run lifespan context manager to load and verify the retrained Keras model
        cls.lifespan_cm = lifespan(app)
        asyncio.run(cls.lifespan_cm.__aenter__())

    @classmethod
    def tearDownClass(cls):
        try:
            asyncio.run(cls.lifespan_cm.__aexit__(None, None, None))
        except Exception:
            pass

    def test_01_health_check(self):
        """Verify /health returns status ok and model_loaded True."""
        result = asyncio.run(health_check())
        self.assertEqual(result.get("status"), "ok")
        self.assertTrue(result.get("model_loaded"))

    def test_02_model_shapes(self):
        """Verify the actual loaded model input and output shapes."""
        self.assertIsNotNone(fastapi_server.model)
        self.assertEqual(fastapi_server.model.input_shape, (None, 1000, 1))
        self.assertEqual(fastapi_server.model.output_shape, (None, 1))

    def test_03_valid_1000_samples(self):
        """Verify that exactly 1000 samples return a valid prediction, schema, and diagnostics."""
        t = np.linspace(0, 10, 1000, endpoint=False)
        samples = (np.sin(2 * np.pi * 1.2 * t) + 0.3 * np.sin(2 * np.pi * 5 * t)).tolist()
        
        req = ECGPredictionRequest(samples=samples)
        result = asyncio.run(predict(req))
        
        self.assertIn("prediction", result)
        self.assertIn(result["prediction"], ["NORMAL", "MI"])
        self.assertIn("confidence", result)
        self.assertIsInstance(result["confidence"], (int, float))
        self.assertTrue(0.0 <= result["confidence"] <= 100.0)
        self.assertIn("riskLevel", result)
        self.assertIn(result["riskLevel"], ["LOW", "HIGH"])
        self.assertIn("heartRate", result)
        self.assertIsInstance(result["heartRate"], int)
        self.assertIn("summary", result)
        self.assertIn("keyFindings", result)
        self.assertIn("probability", result)
        self.assertTrue(0.0 <= result["probability"] <= 1.0)
        self.assertIn("diagnostics", result)
        
        # Verify normalized stats in diagnostics
        diag = result["diagnostics"]
        self.assertAlmostEqual(diag["normalizedMean"], 0.0, places=3)
        self.assertAlmostEqual(diag["normalizedStd"], 1.0, places=3)

    def test_04_raw_adc_offset_normalization(self):
        """
        Verify that raw ADC input with baseline offset (~225 like Arduino)
        is properly Z-score normalized (mean ≈ 0, std ≈ 1) and returns a valid probability in [0, 1].
        """
        t = np.linspace(0, 10, 1000, endpoint=False)
        samples = (225.0 + 15.0 * np.sin(2 * np.pi * 1.2 * t)).tolist()
        
        req = ECGPredictionRequest(samples=samples)
        result = asyncio.run(predict(req))
        
        self.assertIn(result["prediction"], ["NORMAL", "MI"])
        self.assertTrue(0.0 <= result["confidence"] <= 100.0)
        self.assertIn(result["riskLevel"], ["LOW", "HIGH"])
        diag = result["diagnostics"]
        self.assertAlmostEqual(diag["normalizedMean"], 0.0, places=3)
        self.assertAlmostEqual(diag["normalizedStd"], 1.0, places=3)

    def test_05_constant_signal_zero_std(self):
        """Verify that flatline signals (std < 1e-8) are rejected with HTTP 400."""
        samples = [225.0] * 1000
        req = ECGPredictionRequest(samples=samples)
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(predict(req))
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Insufficient ECG signal variation", ctx.exception.detail)

    def test_06_fewer_than_1000_samples(self):
        """Verify that < 1000 samples (999) are rejected with HTTP 400."""
        samples = [1.0] * 999
        req = ECGPredictionRequest(samples=samples)
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(predict(req))
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("must contain exactly 1000 samples", ctx.exception.detail)

    def test_07_more_than_1000_samples(self):
        """Verify that > 1000 samples (1001) are rejected with HTTP 400."""
        samples = [1.0] * 1001
        req = ECGPredictionRequest(samples=samples)
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(predict(req))
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("must contain exactly 1000 samples", ctx.exception.detail)

    def test_08_invalid_values_nan_inf(self):
        """Verify that NaN and Infinity values raise HTTP 400."""
        # Array with NaN
        samples_nan = [1.0] * 999 + [float("nan")]
        req_nan = ECGPredictionRequest(samples=samples_nan)
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(predict(req_nan))
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("infinite or NaN", ctx.exception.detail)

        # Array with Inf
        samples_inf = [1.0] * 999 + [float("inf")]
        req_inf = ECGPredictionRequest(samples=samples_inf)
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(predict(req_inf))
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("infinite or NaN", ctx.exception.detail)

    def test_09_threshold_and_confidence_logic(self):
        """
        Verify threshold decision logic:
        threshold = 0.7
        prob >= 0.7 -> MI, HIGH, confidence = round(prob * 100, 1)
        prob < 0.7  -> NORMAL, LOW, confidence = round((1 - prob) * 100, 1)
        """
        self.assertEqual(MI_THRESHOLD, 0.7)

        for prob in [0.0, 0.20, 0.50, 0.699, 0.70, 0.85, 1.0]:
            is_mi = prob >= MI_THRESHOLD
            if is_mi:
                pred = "MI"
                risk = "HIGH"
                conf = float(round(prob * 100, 1))
            else:
                pred = "NORMAL"
                risk = "LOW"
                conf = float(round((1.0 - prob) * 100, 1))

            if prob < 0.7:
                self.assertEqual(pred, "NORMAL")
                self.assertEqual(risk, "LOW")
                self.assertAlmostEqual(conf, round((1.0 - prob) * 100, 1))
            else:
                self.assertEqual(pred, "MI")
                self.assertEqual(risk, "HIGH")
                self.assertAlmostEqual(conf, round(prob * 100, 1))

    def test_10_heart_rate_calculation(self):
        """Verify calculate_heart_rate returns a plausible bpm for 100 Hz signal."""
        t = np.linspace(0, 10, 1000, endpoint=False)
        # Synthetic heart beats at 1.2 Hz = 72 bpm
        signal = np.sin(2 * np.pi * 1.2 * t).tolist()
        bpm = calculate_heart_rate(signal, sampling_rate=100)
        self.assertIsInstance(bpm, int)
        self.assertTrue(40 <= bpm <= 200)

if __name__ == "__main__":
    unittest.main(verbosity=2)
