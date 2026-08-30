import ECGChart from "./ECGChart";
export default function LiveECGMonitor({ samples = [], status = "Ready" }) { return <section className="live-ecg-monitor"><div className="ecg-monitor-header"><h3>ECG Monitor</h3><span>{status}</span></div><ECGChart samples={samples} /></section>; }
