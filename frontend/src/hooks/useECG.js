import { useCallback, useState } from "react";
import { deleteSession, getHistory, processECG } from "../services/ecg.service";
import { normalizeListResponse } from "../utils/helpers";

// The backend is the source of truth for ECG waveform data.
// We intentionally do not generate mock ECG samples in the frontend.
const extractSignal = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "object") {
    const candidates = [
      value.samples,
      value.signal,
      value.ecgSignal,
      value.ecg_signal,
      value.waveform,
      value.waveformData,
      value.data,
    ];
    for (const candidate of candidates) {
      const signal = extractSignal(candidate);
      if (signal.length) return signal;
    }
  }
  return [];
};

export function getECGSignal(session) {
  if (!session) return [];
  return extractSignal(session);
}

export function useECG() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [currentSignal, setCurrentSignal] = useState([]);

  const fetchHistory = useCallback(async (profileId) => {
    if (!profileId) return [];
    setLoading(true); setError(null);
    try {
      const result = normalizeListResponse(await getHistory(profileId));
      setHistory(result);
      return result;
    } catch (err) {
      setHistory([]); setError(err); throw err;
    } finally { setLoading(false); }
  }, []);

  const runSession = useCallback(async (profileId) => {
    if (!profileId) return { history: [], signal: [] };
    setProcessing(true); setError(null); setCurrentSignal([]);
    try {
      // The backend receives the patient ID and performs the ECG test.
      // No synthetic ECG data is created by the frontend.
      const response = await processECG({ profileId });
      const responseSignal = extractSignal(response);
      if (responseSignal.length) setCurrentSignal(responseSignal);

      const refreshedHistory = await fetchHistory(profileId);
      const latest = refreshedHistory[0];
      const historySignal = extractSignal(latest);
      if (!responseSignal.length && historySignal.length) setCurrentSignal(historySignal);

      return { result: response, history: refreshedHistory, signal: responseSignal.length ? responseSignal : historySignal };
    } catch (err) {
      setError(err); throw err;
    } finally { setProcessing(false); }
  }, [fetchHistory]);

  const removeSession = useCallback(async (sessionId) => {
    await deleteSession(sessionId);
    setHistory((current) => current.filter((item) => item.id !== sessionId));
  }, []);

  return { history, setHistory, loading, processing, error, currentSignal, setCurrentSignal, fetchHistory, runSession, removeSession };
}
