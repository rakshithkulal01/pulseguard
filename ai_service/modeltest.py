import numpy as np
import pandas as pd
import keras

# Load model
model = keras.models.load_model("Best_1DCNN.keras")

# Load ONE known NORMAL ECG
df = pd.read_csv("MI_LeadII_8.csv")

ecg = pd.to_numeric(
    df["Lead_2"],
    errors="coerce"
).dropna().to_numpy(dtype=np.float32)

ecg = ecg[:1000]

# Same preprocessing as training
mean = np.mean(ecg)
std = np.std(ecg)

normalized = (ecg - mean) / std

# Model input
input_data = normalized.reshape(1, 1000, 1)

# Prediction
probability = float(model.predict(input_data, verbose=0)[0][0])

print("MI training ECG")
print("Raw min:", ecg.min())
print("Raw max:", ecg.max())
print("Raw mean:", ecg.mean())
print("Raw std:", ecg.std())

print("\nNormalized")
print("min:", normalized.min())
print("max:", normalized.max())
print("mean:", normalized.mean())
print("std:", normalized.std())

print("\nModel probability:", probability)
print("Prediction:", "MI" if probability >= 0.7 else "NORMAL")