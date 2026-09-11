#!/usr/bin/env python3
"""
Final Upgraded Training Loop with Stronger Regularization
Focuses on learning amplitude-invariant MI patterns and better generalization.
"""

import os
import sys
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import (
    Input,
    Conv1D,
    BatchNormalization,
    Activation,
    MaxPooling1D,
    Dropout,
    GlobalAveragePooling1D,
    Dense,
)
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import random

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PREPROCESSED_PATH = os.path.join(BASE_DIR, "Preprocessed")
MODEL_PATH = os.path.join(BASE_DIR, "Models")
IO_DIR = os.path.join(BASE_DIR, "ai_service", "io")

MODEL_NAME = "Best_1DCNN.keras"
EPOCHS = 100
BATCH_SIZE = 32
LEARNING_RATE = 0.001
SEED = 42
MI_THRESHOLD = 0.5

np.random.seed(SEED)
tf.random.set_seed(SEED)
random.seed(SEED)


def compute_st_features(ecg):
    """Compute ST-segment elevation/depression metric for MI detection.
    Uses simple peak-to-trough analysis around the waveform center.
    """
    # Find peak index roughly at 40% of signal (QRS region estimate)
    peak_idx = int(len(ecg) * 0.4)
    # Look for max value around this region
    search_start = max(0, peak_idx - 50)
    search_end = min(len(ecg), peak_idx + 50)
    peak_val = np.max(ecg[search_start:search_end])
    # ST segment: 100-200 samples after peak
    st_start = search_start + 100
    st_end = min(len(ecg), st_start + 200)
    st_val = np.mean(ecg[st_start:st_end]) if st_start < len(ecg) else 0.0
    # ST elevation = ST segment mean - baseline (mean of full signal)
    baseline = np.mean(ecg)
    st_elevation = float(st_val - baseline)
    return [st_elevation]


def load_preprocessed_data():
    """Load preprocessed data and apply per-sample z-score normalization."""
    X_train = np.load(os.path.join(PREPROCESSED_PATH, "X_train.npy"))
    y_train = np.load(os.path.join(PREPROCESSED_PATH, "y_train.npy"))
    X_val = np.load(os.path.join(PREPROCESSED_PATH, "X_val.npy"))
    y_val = np.load(os.path.join(PREPROCESSED_PATH, "y_val.npy"))
    X_test = np.load(os.path.join(PREPROCESSED_PATH, "X_test.npy"))
    y_test = np.load(os.path.join(PREPROCESSED_PATH, "y_test.npy"))

    def z_score_normalize(ecg):
        mean = np.mean(ecg)
        std = np.std(ecg)
        if std < 1e-8:
            return np.zeros_like(ecg)
        return (ecg - mean) / std

    X_train = np.array([z_score_normalize(ecg) for ecg in X_train], dtype=np.float32)
    X_val = np.array([z_score_normalize(ecg) for ecg in X_val], dtype=np.float32)
    X_test = np.array([z_score_normalize(ecg) for ecg in X_test], dtype=np.float32)

    # Compute ST-segment elevation feature (clinical MI marker) for each sample
    st_train = np.array([compute_st_features(ecg) for ecg in X_train], dtype=np.float32)
    st_val = np.array([compute_st_features(ecg) for ecg in X_val], dtype=np.float32)
    st_test = np.array([compute_st_features(ecg) for ecg in X_test], dtype=np.float32)

    X_train = X_train[..., np.newaxis]
    X_val = X_val[..., np.newaxis]
    X_test = X_test[..., np.newaxis]

    print(f"X_train: {X_train.shape}, y_train: {y_train.shape}")
    print(f"X_val: {X_val.shape}, y_val: {y_val.shape}")
    print(f"X_test: {X_test.shape}, y_test: {y_test.shape}")

    for name, y in [("Train", y_train), ("Val", y_val), ("Test", y_test)]:
        unique, counts = np.unique(y, return_counts=True)
        print(f"{name} distribution: " + ", ".join(f"Class {int(l)}: {c}" for l, c in zip(unique, counts)))

    return X_train, y_train, X_val, y_val, X_test, y_test, st_train, st_val, st_test


def compute_class_weights(y_train):
    classes = np.unique(y_train)
    weights = compute_class_weight(class_weight="balanced", classes=classes, y=y_train)
    class_weights = {int(cls): float(w) for cls, w in zip(classes, weights)}
    print(f"Class weights: {class_weights}")
    return class_weights


def augment_ecg(ecg, training=True):
    """Apply augmentation that teaches amplitude-invariant MI pattern recognition."""
    if not training:
        return ecg

    ecg = ecg.copy().astype(np.float32)

    # 1. Noise injection (sensor noise, EMG interference)
    noise_factor = np.random.uniform(0.003, 0.02)
    noise = np.random.normal(0, noise_factor, ecg.shape[0])
    ecg = ecg + noise

    # 2. Baseline wander (respiration, electrode movement)
    freq = np.random.uniform(0.1, 0.3)
    t = np.linspace(0, 10, ecg.shape[0])
    drift_amplitude = np.random.uniform(0.01, 0.04)
    drift = drift_amplitude * np.sin(2 * np.pi * freq * t)
    ecg = ecg + drift

    # 3. Amplitude scaling (variable electrode gain)
    # Crucial: allows model to learn patterns independent of absolute amplitude
    gain = np.random.uniform(0.5, 1.8)  # Wider range for robustness
    ecg = ecg * gain

    # 4. Time shift (heart rate variability)
    shift = np.random.randint(-5, 5)
    ecg = np.roll(ecg, shift, axis=0)

    # 5. Mild clipping
    ecg = np.clip(ecg, -4, 4)

    return ecg


def build_model(ecg_input_shape=(1000, 1), st_input_shape=(1,)):
    """Simpler 1D CNN architecture with ST-segment clinical feature integration."""
    # ECG waveform input
    ecg_input = Input(shape=ecg_input_shape, name="ecg_input")
    x = Conv1D(filters=16, kernel_size=9, padding="same")(ecg_input)
    x = BatchNormalization()(x)
    x = Activation("relu")(x)
    x = MaxPooling1D(pool_size=2)(x)
    x = Dropout(0.30)(x)
    x = Conv1D(filters=32, kernel_size=7, padding="same")(x)
    x = BatchNormalization()(x)
    x = Activation("relu")(x)
    x = MaxPooling1D(pool_size=2)(x)
    x = Dropout(0.35)(x)
    x = Conv1D(filters=64, kernel_size=5, padding="same")(x)
    x = BatchNormalization()(x)
    x = Activation("relu")(x)
    x = MaxPooling1D(pool_size=2)(x)
    x = Dropout(0.40)(x)
    x = Conv1D(filters=128, kernel_size=3, padding="same")(x)
    x = BatchNormalization()(x)
    x = Activation("relu")(x)
    x = MaxPooling1D(pool_size=2)(x)
    x = Dropout(0.45)(x)
    ecg_features = GlobalAveragePooling1D()(x)

    # ST-segment elevation feature input (clinical MI marker)
    st_input = Input(shape=st_input_shape, name="st_input")
    st_features = Dense(8, activation="relu", name="st_dense")(st_input)

    # Combine ECG waveform features with clinical ST features
    combined = tf.keras.layers.concatenate([ecg_features, st_features])
    x = Dense(32, activation="relu")(combined)
    x = Dropout(0.5)(x)
    output = Dense(1, activation="sigmoid", name="prediction")(x)

    model = tf.keras.Model(inputs=[ecg_input, st_input], outputs=output)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=LEARNING_RATE),
        loss="binary_crossentropy",
        metrics=["accuracy", tf.keras.metrics.AUC(name="auc")],
    )
    model.summary()
    return model


def get_callbacks(model_path):
    return [
        EarlyStopping(
            monitor="val_auc",
            mode="max",
            patience=15,
            restore_best_weights=True,
            verbose=1,
        ),
        ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=5,
            min_lr=1e-6,
            verbose=1,
        ),
        ModelCheckpoint(
            model_path,
            monitor="val_auc",
            mode="max",
            save_best_only=True,
            verbose=1,
        ),
    ]


def load_io_test_files(io_dir):
    results = {}
    for fname in sorted(os.listdir(io_dir)):
        if not fname.endswith(".csv"):
            continue
        filepath = os.path.join(io_dir, fname)
        df = pd.read_csv(filepath)
        ecg = pd.to_numeric(df["Lead_2"], errors="coerce").dropna().to_numpy(dtype=np.float32)
        ecg = ecg[:1000]
        label = "MI" if fname.lower().startswith("mi") else "NORMAL"
        results[fname] = {"samples": ecg, "expected": label}
    return results


def predict_ecg(model, samples, apply_normalization=True):
    arr = np.asarray(samples, dtype=np.float32)
    if len(arr) != 1000:
        raise ValueError(f"Expected exactly 1000 samples, got {len(arr)}")

    if apply_normalization:
        mean = float(np.mean(arr))
        std = float(np.std(arr))
        if std >= 1e-8:
            normalized = (arr - mean) / std
        else:
            normalized = arr - mean
    else:
        normalized = arr
    ecg_input = normalized.reshape(1, 1000, 1)

    # Compute ST feature for clinical prediction
    st_feature = np.array([compute_st_features(arr)], dtype=np.float32)

    prob = float(np.squeeze(model.predict([ecg_input, st_feature], verbose=0)).item())
    is_mi = prob >= MI_THRESHOLD
    return "MI" if is_mi else "NORMAL", prob


def evaluate_on_io_files(model, io_dir):
    print("\n=== Evaluating on io/ test files ===")
    test_files = load_io_test_files(io_dir)
    correct = 0
    total = 0
    for fname, data in sorted(test_files.items()):
        pred, prob = predict_ecg(model, data["samples"], apply_normalization=True)
        expected = data["expected"]
        match = "✓" if pred == expected else "✗ MISMATCH"
        if pred == expected:
            correct += 1
        total += 1
        print(f"  {fname}: expected={expected} predicted={pred} prob={prob:.4f} {match}")
    print(f"  Accuracy on io/ files: {correct}/{total} ({100*correct/total:.1f}%)")
    return correct, total


def evaluate_on_test_set(model, test_inputs, y_test):
    print("\n=== Test Set Evaluation ===")
    # test_inputs can be [X, st] list or just X for backward compatibility
    if isinstance(test_inputs, list) and len(test_inputs) == 2:
        y_pred_prob = model.predict(test_inputs, verbose=0).squeeze()
    else:
        y_pred_prob = model.predict(test_inputs, verbose=0).squeeze()
    y_pred = (y_pred_prob >= MI_THRESHOLD).astype(int)
    print(classification_report(y_test, y_pred, target_names=["NORMAL", "MI"]))
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    try:
        auc = roc_auc_score(y_test, y_pred_prob)
        print(f"AUC: {auc:.4f}")
    except Exception:
        pass


def main():
    os.makedirs(MODEL_PATH, exist_ok=True)
    model_save_path = os.path.join(MODEL_PATH, MODEL_NAME)

    print("Loading preprocessed data...")
    X_train, y_train, X_val, y_val, X_test, y_test, st_train, st_val, st_test = load_preprocessed_data()

    print("\nBuilding model with ST-segment clinical features...")
    model = build_model()

    callbacks = get_callbacks(model_save_path)

    print(f"\nTraining for up to {EPOCHS} epochs with ST features...")
    history = model.fit(
        [X_train, st_train], y_train,
        validation_data=([X_val, st_val], y_val),
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        callbacks=callbacks,
        class_weight=compute_class_weights(y_train),
        verbose=1,
    )

    print(f"\nBest model saved to {model_save_path}")

    print("\n=== Final Test Set Evaluation ===")
    evaluate_on_test_set(model, [X_test, st_test], y_test)

    correct, total = evaluate_on_io_files(model, IO_DIR)

    if correct < total:
        print(f"\nWARNING: {total - correct}/{total} io/ files misclassified. Consider further tuning or collecting more diverse data.")
    else:
        print(f"\nAll {total} io/ test files classified correctly!")


if __name__ == "__main__":
    main()