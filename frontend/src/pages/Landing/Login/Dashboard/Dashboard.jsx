import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import { getProfiles } from "../../../../services/profile";
import { getHistory, processECG, deleteSession } from "../../../../services/ecg";
import { downloadReport } from "../../../../services/report";
import "./Dashboard.css";
//temporary import for logout function
import heartImage from "../../../../assets/images/pulseguard-heart-reference.png";

function Dashboard() {
  const { token } = useAuth();

console.log("ACCESS TOKEN:", token);
  const navigate = useNavigate();
  const { session, user, loading, logout } = useAuth();

  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);

  // Modal and ECG states
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [runningSession, setRunningSession] = useState(false);

  useEffect(() => {
    if (!loading && !session) {
      navigate("/");
    } else if (session) {
      fetchPatients();
    }
  }, [session, loading, navigate]);

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      const res = await getProfiles();
      setPatients(res.data || []);
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleViewHistory = async (patient) => {
    setSelectedPatient(patient);
    setLoadingHistory(true);
    try {
      const res = await getHistory(patient.id);
      setHistory(res.data || []);
    } catch (error) {
      console.error("Error fetching ECG history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRunECG = async () => {
    if (!selectedPatient) return;
    setRunningSession(true);
    try {
      // Generate mock ECG data: 250 data points simulating heart beats
      const samples = Array.from({ length: 250 }, (_, i) => {
        const base = Math.sin(i / 10);
        // Add random spikes to simulate QRS complexes
        const spike = i % 30 === 0 ? (Math.random() > 0.5 ? 2.0 : -0.5) : 0;
        return Number((base + spike + Math.random() * 0.15).toFixed(3));
      });

      const payload = {
        profileId: selectedPatient.id,
        duration: 10,
        samplingRate: 250,
        samples,
      };

      await processECG(payload);
      
      // Refresh history and dashboard profile list
      const res = await getHistory(selectedPatient.id);
      setHistory(res.data || []);
      fetchPatients();
      
      alert("ECG session processed successfully! Report has been generated.");
    } catch (error) {
      alert("Error processing ECG: " + (error.response?.data?.message || error.message));
    } finally {
      setRunningSession(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to delete this ECG session?")) return;
    try {
      await deleteSession(sessionId);
      setHistory(history.filter((s) => s.id !== sessionId));
      fetchPatients();
    } catch (error) {
      alert("Error deleting session: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDownloadReport = async (sessionId) => {
    try {
      const blob = await downloadReport(sessionId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ECG_Report_${sessionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      alert("Error downloading report: " + error.message);
    }
  };

  const getInitials = (name) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const mapBloodGroup = (bg) => {
    const map = {
      A_POSITIVE: "A+",
      A_NEGATIVE: "A-",
      B_POSITIVE: "B+",
      B_NEGATIVE: "B-",
      AB_POSITIVE: "AB+",
      AB_NEGATIVE: "AB-",
      O_POSITIVE: "O+",
      O_NEGATIVE: "O-",
    };
    return map[bg] || bg;
  };

  const mapGender = (g) => {
    if (!g) return "";
    return g.charAt(0) + g.slice(1).toLowerCase();
  };

  const getCardType = (index) => {
    const types = ["blue", "green", "red", "orange"];
    return types[index % types.length];
  };

  const filteredPatients = patients.filter((patient) =>
    patient.fullName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading || !session) {
    return <div className="loading-screen">Loading PulseGuard Dashboard...</div>;
  }

  const doctorName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "User";

  return (
    <div className="dashboard-page">
      {/* HEADER */}
      <header className="dashboard-header">
        <div className="dashboard-logo">
          <div className="dashboard-logo-icon">
            <img src={heartImage} alt="PulseGuard" />
          </div>
          <div>
            <h1>PulseGuard</h1>
            <p>AI HEALTH PLATFORM</p>
          </div>
        </div>

        <div className="header-actions">
          <button className="settings-button">
            <span>⚙</span>
            Settings
          </button>
          <div className="header-divider"></div>
          <button className="logout-button" onClick={handleLogout}>
            <span>⇥</span>
            Logout
          </button>
        </div>
      </header>

      {/* WELCOME */}
      <section className="welcome-section">
        <div className="welcome-content">
          <p className="welcome-small">Welcome back,</p>
          <h2>
            Dr. {doctorName} <span>👋</span>
          </h2>
          <p className="welcome-description">
            Select a patient profile to view health insights, monitor cardiac metrics, or generate reports.
          </p>
        </div>

        {/* SEARCH */}
        <div className="search-box">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      {/* MAIN */}
      <main className="dashboard-content">
        <div className="patients-heading">
          <div className="patients-title">
            <div className="patients-icon">♧</div>
            <div>
              <h2>My Patient Profiles</h2>
              <p>Manage and monitor your patients</p>
            </div>
          </div>

          {/* ADD NEW PATIENT */}
          <button
            className="add-patient-button"
            onClick={() => navigate("/dashboard/new-patient")}
          >
            <span>＋</span>
            Add New Patient
          </button>
        </div>

        {/* PATIENT CARDS */}
        <div className="patients-grid">
          {loadingPatients ? (
            <div className="loading-patients">Loading profiles...</div>
          ) : filteredPatients.length === 0 ? (
            <div className="no-patients">No patient profiles found. Create one to get started!</div>
          ) : (
            filteredPatients.map((patient, index) => {
              const latestSession = patient.sessions?.[0];
              const bpmDisplay = latestSession?.heartRate
                ? `${latestSession.heartRate} BPM`
                : "N/A";
              const monitoredDisplay = latestSession?.createdAt
                ? new Date(latestSession.createdAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Never monitored";

              return (
                <div
                  className={`patient-card ${getCardType(index)}`}
                  key={patient.id}
                  onClick={() => handleViewHistory(patient)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="patient-card-top">
                    <div className="patient-status">
                      <span>•</span>
                      Active
                    </div>
                    <button
                      className="more-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Action menu placeholder
                      }}
                    >
                      •••
                    </button>
                  </div>

                  <div className="patient-avatar">
                    {getInitials(patient.fullName)}
                  </div>

                  <h3>{patient.fullName}</h3>

                  <div className="patient-details">
                    <div className="detail-item">
                      <strong>♙</strong>
                      <div>
                        <b>{patient.age} yrs</b>
                        <span>Age</span>
                      </div>
                    </div>

                    <div className="detail-item">
                      <strong>
                        {patient.gender === "FEMALE" ? "♀" : "♂"}
                      </strong>
                      <div>
                        <b>{mapGender(patient.gender)}</b>
                        <span>Gender</span>
                      </div>
                    </div>

                    <div className="detail-item">
                      <strong>♢</strong>
                      <div>
                        <b>{mapBloodGroup(patient.bloodGroup)}</b>
                        <span>Blood Group</span>
                      </div>
                    </div>
                  </div>

                  <div className="monitoring-details">
                    <div className="monitor-item">
                      <span className="heart-icon">♥</span>
                      <div>
                        <b>{bpmDisplay}</b>
                        <span>Last Reading</span>
                      </div>
                    </div>

                    <div className="monitor-item">
                      <span className="calendar-icon">▣</span>
                      <div>
                        <b>{monitoredDisplay}</b>
                        <span>Last Monitored</span>
                      </div>
                    </div>
                  </div>

                  <button
                    className="history-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewHistory(patient);
                    }}
                  >
                    View History
                    <span>→</span>
                  </button>
                </div>
              );
            })
          )}

          {/* ADD NEW PATIENT CARD */}
          <button
            className="new-patient-card"
            onClick={() => navigate("/dashboard/new-patient")}
          >
            <div className="new-patient-icon">♙+</div>
            <h3>Add New Patient</h3>
            <p>
              Create a new patient profile
              <br />
              to start monitoring.
            </p>
          </button>
        </div>

        {/* SECURITY */}
        <section className="security-banner">
          <div className="security-image">
            <div className="security-heart">♥</div>
          </div>

          <div className="security-content">
            <h3>
              Secure <span>•</span> Private <span>•</span> Trusted
            </h3>
            <p>
              All patient data is encrypted and protected with enterprise-grade security.
            </p>
            <p>We are HIPAA compliant and committed to your privacy.</p>
          </div>

          <div className="hipaa-badge">
            <div className="shield-icon">✓</div>
            <div>
              <strong>HIPAA</strong>
              <span>COMPLIANT</span>
            </div>
          </div>
        </section>
      </main>

      {/* ECG HISTORY MODAL */}
      {selectedPatient && (
        <div className="modal-backdrop" onClick={() => setSelectedPatient(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{selectedPatient.fullName}</h2>
                <p className="modal-subtitle">
                  {selectedPatient.age} yrs • {mapGender(selectedPatient.gender)} • Blood Group {mapBloodGroup(selectedPatient.bloodGroup)}
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedPatient(null)}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="session-run-bar">
                <h3>Cardiac Monitoring</h3>
                <button
                  className="run-ecg-btn"
                  onClick={handleRunECG}
                  disabled={runningSession}
                >
                  {runningSession ? "Simulating ECG..." : "Run New ECG Session"}
                </button>
              </div>

              {loadingHistory ? (
                <div className="modal-loading">Loading ECG history...</div>
              ) : history.length === 0 ? (
                <div className="modal-empty-history">
                  No ECG recordings found for this patient. Click "Run New ECG Session" to collect data.
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
                      {history.map((session) => (
                        <tr key={session.id}>
                          <td>{new Date(session.createdAt).toLocaleString()}</td>
                          <td>
                            <span className={`status-badge ${session.status.toLowerCase()}`}>
                              {session.status}
                            </span>
                          </td>
                          <td>
                            {session.prediction ? (
                              <span className={`prediction-badge ${session.prediction.toLowerCase()}`}>
                                {session.prediction}
                              </span>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td>{session.heartRate ? `${session.heartRate} BPM` : "N/A"}</td>
                          <td>
                            {session.riskLevel ? (
                              <span className={`risk-badge ${session.riskLevel.toLowerCase()}`}>
                                {session.riskLevel}
                              </span>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td className="actions-cell">
                            {session.status === "COMPLETED" && (
                              <button
                                className="action-btn download-btn"
                                onClick={() => handleDownloadReport(session.id)}
                                title="Download Report"
                              >
                                PDF
                              </button>
                            )}
                            <button
                              className="action-btn delete-btn"
                              onClick={() => handleDeleteSession(session.id)}
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
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="dashboard-footer">
        <p>© 2026 PulseGuard AI Health Platform. All rights reserved.</p>
        <span>Version 1.0.0</span>
      </footer>
    </div>
  );
}

export default Dashboard;