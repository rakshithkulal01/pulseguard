export default function ECGControls({ onRun, running }) {
  return (
    <div className="session-run-bar">
      <h3>Cardiac Monitoring</h3>
      <button
        className="run-ecg-btn"
        type="button"
        onClick={onRun}
        disabled={running}
      >
        {running ? "Simulating ECG..." : "Run New ECG Session"}
      </button>
    </div>
  );
}
