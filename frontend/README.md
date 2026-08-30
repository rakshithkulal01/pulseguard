# PulseGuard Frontend

Refactored React/Vite frontend for the Myocardial Infarction / ECG Anomaly Detection System.

## Architecture

UI components → hooks → services → backend API. Patient, ECG, prediction, reports and authentication concerns are separated.

## Setup

1. Install Node.js (LTS recommended).
2. Copy `.env.example` to `.env` and add your Supabase values.
3. Set `VITE_API_URL` to the backend URL.
4. Run `npm install`.
5. Run `npm run dev`.
6. Run `npm run build` before committing.

## Authentication

Google sign-in uses the existing Supabase provider. Ensure Google OAuth is enabled/configured in the Supabase project and the application URL is included in the allowed redirect URLs.

## Backend contract

The refactor keeps the existing known endpoints: `/api/profiles`, `/api/ecg/process`, `/api/ecg/history/:profileId`, `/api/ecg/session/:id`, `/api/report/:sessionId`, and `/api/report/download/:sessionId`. No new backend endpoints are invented.

## Note

The current backend is developed separately. ECG simulation remains isolated in `hooks/useECG.js` so it can later be replaced by a real streaming/device source without changing the dashboard page.
