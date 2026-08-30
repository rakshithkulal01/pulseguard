export default function ECGStatus({ status }) { const normalized = status?.toLowerCase() || ""; return <span className={`status-badge ${normalized}`}>{status || "N/A"}</span>; }
