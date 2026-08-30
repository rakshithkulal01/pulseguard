import { formatBloodGroup, formatDateTime, formatGender, getInitials } from "../../utils/formatters";
import { getPatientCardType } from "../../constants/colors";

export default function PatientCard({ patient, index, onOpen, onHistory }) {
  const latestSession = patient.sessions?.[0];
  const bpm = latestSession?.heartRate ? `${latestSession.heartRate} BPM` : "N/A";
  return <article className={`patient-card ${getPatientCardType(index)}`} onClick={() => onOpen(patient)} style={{ cursor: "pointer" }} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onOpen(patient)}>
    <div className="patient-card-top"><div className="patient-status"><span>•</span>Active</div><button className="more-button" type="button" onClick={(e) => e.stopPropagation()} aria-label="More patient actions">•••</button></div>
    <div className="patient-avatar">{getInitials(patient.fullName)}</div><h3>{patient.fullName}</h3>
    <div className="patient-details"><Detail icon="♙" value={`${patient.age ?? "N/A"} yrs`} label="Age" /><Detail icon={patient.gender === "FEMALE" ? "♀" : "♂"} value={formatGender(patient.gender)} label="Gender" /><Detail icon="♢" value={formatBloodGroup(patient.bloodGroup)} label="Blood Group" /></div>
    <div className="monitoring-details"><Detail icon="♥" value={bpm} label="Last Reading" heart /><Detail icon="▣" value={formatDateTime(latestSession?.createdAt)} label="Last Monitored" calendar /></div>
    <button className="history-button" type="button" onClick={(e) => { e.stopPropagation(); onHistory(patient); }}>View History <span>→</span></button>
  </article>;
}
function Detail({ icon, value, label, heart, calendar }) { return <div className="detail-item monitor-item"><strong className={heart ? "heart-icon" : calendar ? "calendar-icon" : ""}>{icon}</strong><div><b>{value}</b><span>{label}</span></div></div>; }
