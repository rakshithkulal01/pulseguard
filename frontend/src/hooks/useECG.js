import { useCallback, useState } from "react";
import { deleteSession, getHistory, processECG } from "../services/ecg.service";
import { normalizeListResponse } from "../utils/helpers";

const generateMockECGSamples = (length = 250) => Array.from({ length }, (_, i) => {
  const base = Math.sin(i / 10);
  const spike = i % 30 === 0 ? (Math.random() > 0.5 ? 2 : -0.5) : 0;
  return Number((base + spike + Math.random() * 0.15).toFixed(3));
});

export function useECG() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async (profileId) => {
    if (!profileId) return [];
    setLoading(true); setError(null);
    try { const result = normalizeListResponse(await getHistory(profileId)); setHistory(result); return result; }
    catch (err) { setHistory([]); setError(err); throw err; } finally { setLoading(false); }
  }, []);

  const runSession = useCallback(async (profileId) => {
    if (!profileId) return;
    setProcessing(true); setError(null);
    try {
      await processECG({ profileId, duration: 10, samplingRate: 250, samples: generateMockECGSamples() });
      return fetchHistory(profileId);
    } catch (err) { setError(err); throw err; } finally { setProcessing(false); }
  }, [fetchHistory]);

  const removeSession = useCallback(async (sessionId) => {
    await deleteSession(sessionId);
    setHistory((current) => current.filter((item) => item.id !== sessionId));
  }, []);

  return { history, setHistory, loading, processing, error, fetchHistory, runSession, removeSession };
}
