import ECGChart from "./ECGChart";

export default function LiveECGMonitor({ samples = [], status = "Ready" }) {
  return (
    <section className="live-ecg-monitor">
      <div className="ecg-monitor-header">
        <div>
          <h3>ECG Signal</h3>
          <p>Patient ECG waveform</p>
        </div>
        <span className={status === "Processing..." ? "ecg-monitor-status processing" : "ecg-monitor-status"}>
          <i /> {status}
        </span>
      </div>
      <ECGChart samples={samples} />
    </section>
  );
}
