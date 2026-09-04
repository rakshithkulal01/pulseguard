import Modal from "../common/Modal";
import ECGStatus from "../ecg/ECGStatus";
import RiskIndicator from "../prediction/RiskIndicator";
import DownloadReport from "../reports/DownloadReport";
import { formatBloodGroup, formatGender } from "../../utils/formatters";
import LiveECGMonitor from "../ecg/LiveECGMonitor";
import { getECGSignal } from "../../hooks/useECG";

export default function ECGHistoryModal({
  patient,
  history,
  loading,
  running,
  signal = [],
  statusText = "Ready",
  latestPrediction = null,
  onRun,
  onDelete,
  onClose,
}) {
  return (
    <Modal open={Boolean(patient)} onClose={onClose}>
      <div className="modal-header">
        <div>
          <h2>{patient?.fullName}</h2>
          <p className="modal-subtitle">
            {patient?.age} yrs • {formatGender(patient?.gender)} • Blood Group{" "}
            {formatBloodGroup(patient?.bloodGroup)}
          </p>
        </div>
        <button
          className="modal-close-btn"
          type="button"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
      </div>
      <div className="modal-body">
        <div className="session-run-bar">
          <h3>Cardiac Monitoring</h3>
          <button
            className="run-ecg-btn"
            type="button"
            onClick={onRun}
            disabled={running}
          >
            {running ? "Monitoring Live ECG..." : "Run New ECG Session"}
          </button>
        </div>
        <LiveECGMonitor
          samples={
            signal.length ? signal : history[0] ? getECGSignal(history[0]) : []
          }
          status={
            running
              ? statusText || "Streaming live ECG..."
              : signal.length
                ? "Signal received"
                : "Ready"
          }
        />
        {latestPrediction && (
          <div className="latest-prediction-card" style={{ margin: "16px 0", padding: "16px", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155", color: "#f8fafc" }}>
            <h4 style={{ margin: "0 0 8px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Latest AI Prediction</span>
              <span className={`prediction-badge ${latestPrediction.prediction?.toLowerCase()}`} style={{ padding: "4px 8px", borderRadius: "4px", fontWeight: "bold" }}>
                {latestPrediction.prediction}
              </span>
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", fontSize: "14px", marginTop: "8px" }}>
              <div>Confidence: <strong>{latestPrediction.confidence}%</strong></div>
              <div>Heart Rate: <strong>{latestPrediction.heartRate} BPM</strong></div>
              <div>Risk Level: <RiskIndicator value={latestPrediction.riskLevel} /></div>
            </div>
            {latestPrediction.summary && (
              <p style={{ marginTop: "12px", fontSize: "13px", color: "#cbd5e1" }}>
                {latestPrediction.summary}
              </p>
            )}
          </div>
        )}
        {loading ? (
          <div className="modal-loading">Loading ECG history...</div>
        ) : history.length === 0 ? (
          <div className="modal-empty-history">
            No ECG recordings found for this patient. Click "Run New ECG
            Session" to collect data.
          </div>
        ) : (
          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Prediction</th>
                  <th>Heart Rate</th>
                  <th>Risk Level</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : "N/A"}
                    </td>
                    <td>
                      <ECGStatus status={item.status} />
                    </td>
                    <td>
                      {item.prediction ? (
                        <span
                          className={`prediction-badge ${item.prediction.toLowerCase()}`}
                        >
                          {item.prediction}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td>{item.heartRate ? `${item.heartRate} BPM` : "N/A"}</td>
                    <td>
                      <RiskIndicator value={item.riskLevel} />
                    </td>
                    <td className="actions-cell">
                      {item.status === "COMPLETED" && (
                        <DownloadReport
                          sessionId={item.id}
                          className="action-btn download-btn"
                        >
                          PDF
                        </DownloadReport>
                      )}
                      <button
                        className="action-btn delete-btn"
                        type="button"
                        onClick={() => onDelete(item.id)}
                        title="Delete Session"
                      >
                        &times;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
