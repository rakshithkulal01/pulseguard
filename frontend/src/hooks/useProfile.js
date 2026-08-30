import { useCallback, useEffect, useState } from "react";
import { getProfiles } from "../services/profile.service";
import { normalizeListResponse } from "../utils/helpers";

export function useProfiles(enabled = true) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const fetchPatients = useCallback(async () => {
    if (!enabled) return [];
    setLoading(true); setError(null);
    try { const result = normalizeListResponse(await getProfiles()); setPatients(result); return result; }
    catch (err) { setError(err); throw err; } finally { setLoading(false); }
  }, [enabled]);
  useEffect(() => { fetchPatients().catch(() => {}); }, [fetchPatients]);
  return { patients, setPatients, loading, error, refetch: fetchPatients };
}

export const useProfile = useProfiles;
