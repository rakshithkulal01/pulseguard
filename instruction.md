# Update Pulse Gaurd FastAPI Inference to Use the Retrained 1D-CNN Model

I am working on the **Pulse Gaurd** project, an ECG-based Myocardial Infarction (MI) detection system.

I have uploaded the **newly retrained `.keras` model**. Use the uploaded model as the source of truth for the model architecture, input shape, and output behavior.

## Objective

Replace/update the current FastAPI inference implementation so that it correctly works with this newly retrained model and its training pipeline.

**Do not make assumptions about the model. Inspect the uploaded `.keras` file first.**

---

## Confirmed ML Training Pipeline

The ML team retrained the model using this pipeline:

```text
PTB-XL Dataset
        â†“
Load ECG using WFDB
        â†“
12-Lead ECG
        â†“
Select Lead II
        â†“
1000 samples / ECG
        â†“
10 seconds @ 100 Hz
        â†“
Label:
    Normal only â†’ 0
    Any MI code â†’ 1
        â†“
Exclude other classes
        â†“
Stratified split:
    Training   64%
    Validation 16%
    Testing    20%
        â†“
Hardware noise augmentation
(training only)
        â†“
Per-ECG Z-score normalization
        â†“
Each 1000-sample ECG gets
its OWN mean and std
        â†“
1D CNN
        â†“
Sigmoid output
        â†“
MI probability
        â†“
Threshold = 0.7
        â†“
< 0.7 â†’ NORMAL
â‰¥ 0.7 â†’ MI
```

### Important normalization requirement

The new model uses **per-ECG Z-score normalization**.

For every incoming 1000-sample ECG:

```python
mean = np.mean(samples)
std = np.std(samples)

normalized = (samples - mean) / std
```

The normalization must happen **before sending the data to the CNN**.

Do NOT use the previously calculated global mean/std:

```text
Global Mean = -0.00037869852
Global Std  = 0.9833788
```

Those global values belong to the previous preprocessing approach and should not be used for this retrained model unless inspection of the uploaded model/training implementation proves otherwise.

The important rule is:

```text
1000 raw samples
      â†“
calculate THIS batch's mean
      â†“
calculate THIS batch's std
      â†“
Z-score normalize
      â†“
model
```

Do not calculate mean/std after normalization.

---

# First: Inspect the Uploaded `.keras` Model

Before modifying code, inspect the uploaded model and determine:

1. Model input shape
2. Model output shape
3. Number of outputs
4. Model architecture
5. Whether the final layer is sigmoid
6. Whether the model expects `(1, 1000, 1)`
7. Whether there are any preprocessing layers embedded inside the model
8. Output interpretation
9. Whether the model contains any normalization layer that would make external normalization unnecessary

Use the actual model information rather than guessing.

If possible, report the discovered:

```text
Input shape:
Output shape:
Output activation:
Expected input dtype:
Normalization layers:
Final layer:
```

---

# FastAPI Requirements

Update the existing FastAPI inference service in the codebase.

The endpoint should accept:

```json
{
  "samples": [1000 ECG values]
}
```

### Validation

Require exactly **1000 samples**.

Reject:

* fewer than 1000
* more than 1000
* non-numeric values
* NaN
* Infinity
* invalid/empty input

Return an appropriate HTTP 400 response for invalid input.

---

# Preprocessing

For every valid 1000-sample ECG:

```python
samples = np.asarray(samples, dtype=np.float32)

mean = np.mean(samples)
std = np.std(samples)

if std < 1e-8:
    # reject signal because it has insufficient variation

normalized = (samples - mean) / std
```

Use the exact standard deviation convention required by the training implementation if it can be determined from the uploaded model/training code.

Then reshape to the model's actual expected input shape.

For example, if inspection confirms `(None, 1000, 1)`:

```python
model_input = normalized.reshape(1, 1000, 1)
```

---

# Prediction

Run the model on the normalized ECG.

The model produces an MI probability.

Use the following decision threshold:

```text
threshold = 0.7
```

Therefore:

```python
if probability >= 0.7:
    prediction = "MI"
    risk_level = "HIGH"
else:
    prediction = "NORMAL"
    risk_level = "LOW"
```

Do NOT use `0.5`.

The threshold must be **0.7 everywhere in the inference implementation**.

---

# API Response

Maintain compatibility with the existing Node.js backend.

The response should provide at minimum:

```json
{
  "prediction": "MI",
  "confidence": 96.4,
  "riskLevel": "HIGH"
}
```

Use the actual model probability to calculate confidence.

For example:

```text
probability = 0.964
confidence = 96.4
```

For a NORMAL result, make sure the confidence represents the confidence of the predicted class rather than blindly returning the MI probability as the confidence.

For example:

```text
MI probability = 0.20

prediction = NORMAL

confidence = 80.0
```

---

# Existing Pulse Gaurd Architecture

Do not unnecessarily redesign the application.

The current architecture is:

```text
Arduino + AD8232
        â†“
USB Serial
        â†“
Node.js / Express
        â†“
Socket.IO
        â†“
1000 ECG samples
        â†“
FastAPI
        â†“
1D CNN
        â†“
Prediction
        â†“
Node.js
        â†“
Database / Report
        â†“
Frontend
```

The Arduino currently sends raw ECG ADC values through USB at:

```text
115200 baud
100 Hz sampling
```

The Node.js backend collects exactly 1000 samples before calling FastAPI.

The frontend displays the live ECG through Socket.IO.

**Do not move the 1000-sample inference buffering into the frontend.**

---

# Existing Node.js Integration

There is already a `fastapiPredictor.js`.

It currently sends:

```json
{
  "samples": [...]
}
```

to:

```text
POST /predict
```

Verify that the Node.js â†’ FastAPI integration remains compatible.

Do not create a second predictor implementation if the existing one can be updated.

Reuse the existing:

```text
fastapiPredictor.js
ai.service.js
socket.js
```

architecture.

---

# Socket.IO Integration

The current Socket.IO backend:

1. Receives/reads ECG samples
2. Maintains a per-session buffer
3. Collects exactly 1000 samples
4. Calls `predictECG()`
5. Emits:

```text
ecg:prediction
```

Do not break this behavior.

The new FastAPI preprocessing should happen inside the FastAPI inference pipeline, so that every prediction uses the exact same preprocessing.

---

# Important: Diagnose the Existing 100% MI Problem

Before finalizing the changes, investigate why the previous implementation was producing:

```text
MI
HIGH
100% confidence
```

for live Arduino data.

Determine whether the problem was caused by:

* missing normalization
* incorrect normalization
* global normalization instead of per-ECG normalization
* incorrect input shape
* incorrect output interpretation
* incorrect threshold
* raw ADC scale
* model expectations
* another preprocessing mismatch

Do not simply assume the hardware is defective.

The newly retrained model and its preprocessing pipeline should be treated as the primary source of truth.

---

# Do Not Break Existing Functionality

Before editing:

1. Inspect the existing project structure.
2. Identify the current FastAPI files.
3. Identify the Node.js AI integration.
4. Identify Socket.IO inference flow.
5. Identify existing response schemas.
6. Identify existing error handling.
7. Reuse existing utilities where possible.

Do not create duplicate files or duplicate inference logic unnecessarily.

---

# Required Changes

Implement all required changes directly in the codebase.

At the end, provide:

### 1. Model inspection results

```text
Input shape:
Output shape:
Output activation:
Model output meaning:
```

### 2. Files modified

List every modified file and briefly explain the change.

### 3. Preprocessing flow

Show the final actual inference flow:

```text
Raw 1000 samples
â†’ per-ECG mean/std
â†’ Z-score normalization
â†’ reshape
â†’ model
â†’ MI probability
â†’ threshold 0.7
â†’ prediction
```

### 4. API response example

Show an example for:

* NORMAL
* MI

### 5. Testing

Add or update tests where appropriate.

Test at least:

* exactly 1000 samples
* fewer than 1000
* more than 1000
* invalid values
* constant signal / zero standard deviation
* NORMAL probability below 0.7
* MI probability at or above 0.7
* correct confidence calculation
* correct model input shape

### 6. Run verification

After modifying the code, run the existing tests or verification commands available in the project.

If something cannot be tested because a dependency/environment is missing, clearly state that instead of pretending the test passed.

---

## Critical Rules

* **Inspect the uploaded `.keras` model first.**
* **Do not guess the model input/output.**
* **Use per-ECG Z-score normalization.**
* **Do not use the old global mean/std.**
* **Use 0.7 as the MI threshold.**
* **Exactly 1000 samples per inference.**
* **Do not normalize twice.**
* **Do not remove existing Socket.IO functionality.**
* **Do not redesign the entire backend.**
* **Reuse the existing FastAPI and Node.js architecture.**
* **Make the changes directly in the existing codebase.**
* **Keep the implementation production-ready and consistent with the existing project structure.**
* **If the uploaded model contradicts any assumption above, stop and explain the discrepancy before making an incorrect implementation.**
