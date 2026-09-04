import { useCallback, useEffect, useRef, useState } from "react";
import { createSession, deleteSession, getHistory, processECG } from "../services/ecg.service";
import { normalizeListResponse } from "../utils/helpers";
import { getSocket } from "../utils/socket";

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
      value.rawSamples,
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
  const [latestPrediction, setLatestPrediction] = useState(null);
  const [monitoringStatus, setMonitoringStatus] = useState("Ready");
  const [activeSessionId, setActiveSessionId] = useState(null);

  const activeSessionRef = useRef(null);
  const signalBufferRef = useRef([]);

  const fetchHistory = useCallback(async (profileId) => {
    if (!profileId) return [];
    setLoading(true);
    setError(null);
    try {
      const result = normalizeListResponse(await getHistory(profileId));
      setHistory(result);
      return result;
    } catch (err) {
      setHistory([]);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const stopMonitoring = useCallback((sessionId) => {
    const targetSessionId = sessionId || activeSessionRef.current;
    if (targetSessionId) {
      const socket = getSocket();
      if (socket.connected) {
        socket.emit("monitor:stop", { sessionId: targetSessionId });
      }
    }
    activeSessionRef.current = null;
    setActiveSessionId(null);
    setProcessing(false);
    setMonitoringStatus("Ready");
  }, []);

  const runSession = useCallback(
    async (profileId) => {
      if (!profileId) return { history: [], signal: [] };
      setProcessing(true);
      setError(null);
      setCurrentSignal([]);
      setLatestPrediction(null);
      signalBufferRef.current = [];
      setMonitoringStatus("Initiating ECG session...");

      try {
        // 1. Create ECG session record in DB
        const createRes = await createSession({ profileId });
        const sessionObj = createRes.data || createRes;
        const sessionId = sessionObj.id;

        if (!sessionId) {
          throw new Error("Failed to create ECG session: missing session ID.");
        }

        activeSessionRef.current = sessionId;
        setActiveSessionId(sessionId);

        // 2. Connect Socket.IO
        const socket = getSocket();
        if (!socket.connected) {
          socket.connect();
        }

        // 3. Emit monitor:start
        setMonitoringStatus("Waiting for USB ECG signal...");
        socket.emit("monitor:start", { sessionId }, (ack) => {
          if (ack && !ack.success) {
            console.error("monitor:start ack error:", ack.error);
            setError(ack.error || "Failed to start monitoring session.");
            setProcessing(false);
          }
        });

        // 4. Attach socket event handlers
        const handleUpdate = (data) => {
          if (data.sessionId === activeSessionRef.current) {
            signalBufferRef.current.push(data.sample);
            if (signalBufferRef.current.length > 500) {
              signalBufferRef.current.shift();
            }
            setCurrentSignal([...signalBufferRef.current]);
            setMonitoringStatus("Streaming live ECG...");
          }
        };

        const handlePrediction = (data) => {
          if (data.sessionId === activeSessionRef.current) {
            setLatestPrediction(data);
            setMonitoringStatus("Completed");
            setProcessing(false);
            stopMonitoring(data.sessionId);
            fetchHistory(profileId).catch(() => {});
          }
        };

        const handleError = (data) => {
          if (data.sessionId === activeSessionRef.current || !data.sessionId) {
            setError(data.error || "ECG processing error encountered.");
            setMonitoringStatus("Error");
            setProcessing(false);
          }
        };

        socket.off("ecg:update", handleUpdate);
        socket.off("ecg:prediction", handlePrediction);
        socket.off("ecg:error", handleError);

        socket.on("ecg:update", handleUpdate);
        socket.on("ecg:prediction", handlePrediction);
        socket.on("ecg:error", handleError);

        return {
          session: sessionObj,
          sessionId,
        };
      } catch (err) {
        setError(err);
        setProcessing(false);
        setMonitoringStatus("Error");
        throw err;
      }
    },
    [fetchHistory, stopMonitoring],
  );

  const removeSession = useCallback(async (sessionId) => {
    await deleteSession(sessionId);
    setHistory((current) => current.filter((item) => item.id !== sessionId));
  }, []);

  useEffect(() => {
    return () => {
      if (activeSessionRef.current) {
        stopMonitoring(activeSessionRef.current);
      }
    };
  }, [stopMonitoring]);

  return {
    history,
    setHistory,
    loading,
    processing,
    error,
    currentSignal,
    setCurrentSignal,
    latestPrediction,
    monitoringStatus,
    activeSessionId,
    fetchHistory,
    runSession,
    stopMonitoring,
    removeSession,
  };
}
