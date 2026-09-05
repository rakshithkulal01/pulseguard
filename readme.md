# Pulse Gaurd

Pulse Gaurd is an ECG-based Myocardial Infarction (MI) detection system using a **1D-CNN model**, **FastAPI**, **Node.js/Express**, and **Socket.IO**.

## Prerequisites

Install:

* Node.js
* Python 3.10+
* Git

## 1. Clone the Repository

```bash
git clone -b refactor <REPOSITORY_URL>
cd <PROJECT_FOLDER>
```

## 2. Start the Node.js Backend

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
PORT=5000
FASTAPI_URL=http://127.0.0.1:8000
```

Start the backend:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

## 3. Start the FastAPI AI Service

Open a **second terminal** and navigate to the FastAPI/AI service directory:

```bash
cd ai_service
```

Create and activate a virtual environment:

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start FastAPI:

```bash
uvicorn fastapi_server:app --reload --port 8000
```

The AI service runs on:

```text
http://localhost:8000
```

## 4. Verify the AI Service

Open:

```text
http://localhost:8000/health
```

Expected response:

```json
{
  "status": "healthy"
}
```

## 5. ECG Prediction

The FastAPI service accepts exactly **1000 ECG samples**.

Endpoint:

```text
POST /predict
```

Request format:

```json
{
  "samples": [1000 ECG values]
}
```

The service performs per-ECG Z-score normalization and sends the signal to the trained **1D-CNN** model.

The model returns:

* Prediction: `NORMAL` / `MI`
* Confidence
* Risk level
* Heart rate
* Key findings

## Project Flow

```text
ECG Sensor
    ↓
Node.js + Socket.IO
    ↓
1000 ECG Samples
    ↓
FastAPI
    ↓
1D-CNN Model
    ↓
Prediction
    ↓
Node.js
    ↓
Frontend / Report
```

## Important

Run **both services** at the same time:

```text
Node.js / Express  →  Port 5000
FastAPI            →  Port 8000
```

The `refactor` branch contains the current development/stable version for testing.
