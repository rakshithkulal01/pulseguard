import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProfile } from "../services/profile.service";
import { ROUTES } from "../constants/routes";
import { validatePatient } from "../utils/validators";
import { getErrorMessage } from "../utils/formatters";
import { notify } from "../utils/notifications";
import Button from "../components/common/Button";
import "./NewPatient.css";

const BLOOD_GROUPS = {
  "A+": "A_POSITIVE", "A-": "A_NEGATIVE", "B+": "B_POSITIVE", "B-": "B_NEGATIVE",
  "AB+": "AB_POSITIVE", "AB-": "AB_NEGATIVE", "O+": "O_POSITIVE", "O-": "O_NEGATIVE",
};
const GENDERS = { Female: "FEMALE", Male: "MALE", Other: "OTHER" };

export default function NewPatient() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", age: "", gender: "", bloodGroup: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = validatePatient(formData);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await createProfile({
        fullName: formData.name.trim(),
        age: Number(formData.age),
        gender: GENDERS[formData.gender],
        bloodGroup: BLOOD_GROUPS[formData.bloodGroup],
      });
      notify.success("Patient profile created successfully!");
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      console.error("Error creating patient profile:", err);
      const message = getErrorMessage(err, "Unable to create the patient profile.");
      setError(message);
      notify.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-patient-page">
      <header className="new-patient-header">
        <div className="small-brand">
          <div className="small-logo">
            <svg width="34" height="34" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <circle cx="20" cy="20" r="18" stroke="#1769ff" strokeWidth="2" />
              <path d="M6 21H12L15 16L19 25L23 14L27 21H34" stroke="#1769ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div><div className="small-brand-name">PulseGuard</div><div className="small-brand-subtitle">AI HEALTH PLATFORM</div></div>
        </div>
        <button className="back-button" type="button" onClick={() => navigate(ROUTES.DASHBOARD)}>← Back to Dashboard</button>
      </header>

      <main className="new-patient-content">
        <div className="page-title">
          <div className="page-title-icon">♙+</div>
          <div><h1>Add New Patient</h1><p>Create a secure patient profile to begin ECG monitoring.</p></div>
        </div>

        <section className="patient-form-card">
          <div className="form-header"><h2>Patient Information</h2><p>Enter the patient's basic information.</p></div>
          <form className="form-body" onSubmit={handleSubmit} noValidate>
            <Field label="Full Name" name="name" value={formData.name} onChange={handleChange} placeholder="Enter patient's full name" error={fieldErrors.name} />
            <div className="form-row">
              <Field label="Age" name="age" type="number" value={formData.age} onChange={handleChange} placeholder="Enter patient's age" min="1" max="120" error={fieldErrors.age} />
              <Select label="Gender" name="gender" value={formData.gender} onChange={handleChange} options={Object.keys(GENDERS)} error={fieldErrors.gender} />
              <Select label="Blood Group" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} options={Object.keys(BLOOD_GROUPS)} error={fieldErrors.bloodGroup} />
            </div>
            {error && <div className="form-error" role="alert">{error}</div>}
            <div className="security-message"><div className="security-icon">✓</div><div><strong>Your information is secure</strong><p>Patient data is sent through the authenticated PulseGuard API.</p></div></div>
            <div className="form-footer">
              <Button type="button" className="cancel-button" onClick={() => navigate(ROUTES.DASHBOARD)}>Cancel</Button>
              <Button type="submit" className="create-button" loading={loading}>Create Patient Profile</Button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

function Field({ label, error, ...props }) {
  return <div className="form-group"><label htmlFor={props.name}>{label} <span>*</span></label><div className="input-wrapper"><input id={props.name} {...props} required /></div>{error && <small className="field-error">{error}</small>}</div>;
}

function Select({ label, name, value, onChange, options, error }) {
  return <div className="form-group"><label htmlFor={name}>{label} <span>*</span></label><div className="input-wrapper"><select id={name} name={name} value={value} onChange={onChange} required><option value="">Select {label.toLowerCase()}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>{error && <small className="field-error">{error}</small>}</div>;
}
