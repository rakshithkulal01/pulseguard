import PatientCard from "./PatientCard";
import EmptyState from "../common/EmptyState";
export default function PatientList({ patients, loading, onOpen, onHistory, onAdd }) {
  if (loading) return <div className="loading-patients">Loading profiles...</div>;
  return <div className="patients-grid">{patients.length ? patients.map((patient, index) => <PatientCard key={patient.id} patient={patient} index={index} onOpen={onOpen} onHistory={onHistory} />) : <EmptyState message="No patient profiles found. Create one to get started!" />}<button className="new-patient-card" type="button" onClick={onAdd}><div className="new-patient-icon">♙+</div><h3>Add New Patient</h3><p>Create a new patient profile<br />to start monitoring.</p></button></div>;
}
