export default function RiskIndicator({ value }) { const normalized = value?.toLowerCase() || "unknown"; return <span className={`risk-badge ${normalized}`}>{value || "N/A"}</span>; }
