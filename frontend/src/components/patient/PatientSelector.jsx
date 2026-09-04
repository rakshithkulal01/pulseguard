export default function PatientSelector({ patients, value, onChange }) {
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Select patient"
    >
      <option value="">Select patient</option>
      {patients.map((patient) => (
        <option key={patient.id} value={patient.id}>
          {patient.fullName}
        </option>
      ))}
    </select>
  );
}
