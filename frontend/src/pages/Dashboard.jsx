import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfiles } from "../hooks/useProfile";
import { useECG } from "../hooks/useECG";
import { ROUTES } from "../constants/routes";
import { getErrorMessage } from "../utils/formatters";
import { notify } from "../utils/notifications";
import DashboardLayout from "../components/layout/DashboardLayout";
import DashboardOverview from "../components/dashboard/DashboardOverview";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardSecurityBanner from "../components/dashboard/DashboardSecurityBanner";
import PatientList from "../components/patient/PatientList";
import ECGHistoryModal from "../components/dashboard/ECGHistoryModal";
import Loader from "../components/common/Loader";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const {
    patients,
    loading: loadingPatients,
    error: patientError,
    refetch,
  } = useProfiles(true);
  const {
    history,
    loading: loadingHistory,
    processing,
    currentSignal,
    setCurrentSignal,
    latestPrediction,
    monitoringStatus,
    fetchHistory,
    runSession,
    removeSession,
  } = useECG();
  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? patients.filter((p) => (p.fullName || "").toLowerCase().includes(query))
      : patients;
  }, [patients, search]);
  if (loadingPatients && !patients.length)
    return <Loader label="Loading PulseGuard Dashboard..." />;
  const openPatient = (patient) =>
    navigate(ROUTES.PROFILE, { state: { patient } });
  const openHistory = async (patient) => {
    setSelectedPatient(patient);
    setCurrentSignal([]);
    try {
      await fetchHistory(patient.id);
    } catch (error) {
      console.error("Error fetching ECG history:", error);
    }
  };
  const runECG = async () => {
    if (!selectedPatient) return;
    try {
      await runSession(selectedPatient.id);
      await refetch();
      notify.success("ECG session started. Streaming live data...");
    } catch (error) {
      notify.error(`Unable to start ECG monitoring: ${getErrorMessage(error)}`);
    }
  };
  const deleteECG = async (sessionId) => {
    if (!window.confirm("Are you sure you want to delete this ECG session?"))
      return;
    try {
      await removeSession(sessionId);
      await refetch();
    } catch (error) {
      notify.error(`Error deleting session: ${getErrorMessage(error)}`);
    }
  };
  return (
    <DashboardLayout>
      <DashboardOverview>
        <DashboardHeader search={search} onSearch={setSearch} />
        <div className="patients-heading">
          <div className="patients-title">
            <div className="patients-icon">♧</div>
            <div>
              <h2>My Patient Profiles</h2>
              <p>Manage and monitor your patients</p>
            </div>
          </div>
          <button
            className="add-patient-button"
            type="button"
            onClick={() => navigate(ROUTES.NEW_PATIENT)}
          >
            ＋ Add New Patient
          </button>
        </div>
        {patientError && (
          <div className="error-message" role="alert">
            Unable to refresh patient profiles.{" "}
            <button type="button" onClick={() => refetch()}>
              Try again
            </button>
          </div>
        )}
        <PatientList
          patients={filteredPatients}
          loading={loadingPatients}
          onOpen={openPatient}
          onHistory={openHistory}
          onAdd={() => navigate(ROUTES.NEW_PATIENT)}
        />
        <DashboardSecurityBanner />
      </DashboardOverview>
      <ECGHistoryModal
        patient={selectedPatient}
        history={history}
        loading={loadingHistory}
        running={processing}
        signal={currentSignal}
        statusText={monitoringStatus}
        latestPrediction={latestPrediction}
        onRun={runECG}
        onDelete={deleteECG}
        onClose={() => setSelectedPatient(null)}
      />
    </DashboardLayout>
  );
}
