import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProfile } from "../../../../services/profile";
import "./NewPatient.css";

function ArrowLeftIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5" />
      <path d="M12 19L5 12L12 5" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21C4.7 16.8 7.4 14.5 12 14.5C16.6 14.5 19.3 16.8 20 21" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3V7" />
      <path d="M8 3V7" />
      <path d="M3 10H21" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.9V20C22 21.1 21.1 22 20 22C10.6 21.5 2.5 13.4 2 4C2 2.9 2.9 2 4 2H7.1C8.1 2 9 2.7 9.2 3.7L10 7C10.2 7.8 9.9 8.6 9.2 9.1L7.4 10.3C8.7 13.1 10.9 15.3 13.7 16.6L14.9 14.8C15.4 14.1 16.2 13.8 17 14L20.3 14.8C21.3 15 22 15.9 22 16.9Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3L20 6V11C20 16 16.5 20 12 21C7.5 20 4 16 4 11V6L12 3Z" />
      <path d="M9 12L11 14L15 10" />
    </svg>
  );
}

function NewPatient() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    phone: "",
    emergencyContact: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const age = new Date().getFullYear() - new Date(formData.dateOfBirth).getFullYear();
      
      const bloodGroupMapping = {
        "A+": "A_POSITIVE",
        "A-": "A_NEGATIVE",
        "B+": "B_POSITIVE",
        "B-": "B_NEGATIVE",
        "AB+": "AB_POSITIVE",
        "AB-": "AB_NEGATIVE",
        "O+": "O_POSITIVE",
        "O-": "O_NEGATIVE"
      };

      const genderMapping = {
        "Female": "FEMALE",
        "Male": "MALE",
        "Other": "OTHER"
      };

      const payload = {
        fullName: formData.fullName,
        age: age || 1,
        gender: genderMapping[formData.gender],
        bloodGroup: bloodGroupMapping[formData.bloodGroup],
      };

      await createProfile(payload);
      alert("Patient profile created successfully!");
      navigate("/dashboard");
    } catch (error) {
      alert("Error creating patient profile: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-patient-page">

      {/* HEADER */}
      <header className="new-patient-header">

        <div className="new-patient-brand">

          <div className="new-patient-logo">
            <ShieldIcon />
          </div>

          <div>
            <div className="new-patient-brand-name">
              PulseGuard
            </div>

            <div className="new-patient-brand-subtitle">
              AI HEALTH PLATFORM
            </div>
          </div>

        </div>

        <button
          className="back-dashboard-button"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeftIcon />
          Back to Dashboard
        </button>

      </header>


      {/* MAIN */}
      <main className="new-patient-main">

        {/* PAGE TITLE */}
        <div className="new-patient-heading">

          <div className="heading-icon">
            <UserIcon />
          </div>

          <div>
            <h1>Add New Patient</h1>

            <p>
              Create a new patient profile to start monitoring.
            </p>
          </div>

        </div>


        {/* FORM CARD */}
        <form
          className="patient-form-card"
          onSubmit={handleSubmit}
        >

          <div className="form-section">

            <h2>Patient Information</h2>

            <p className="form-description">
              Enter the patient's information below.
            </p>


            <div className="form-grid">

              {/* FULL NAME */}
              <div className="form-group full-width">

                <label htmlFor="fullName">
                  Full Name <span>*</span>
                </label>

                <div className="input-wrapper">

                  <UserIcon />

                  <input
                    id="fullName"
                    type="text"
                    name="fullName"
                    placeholder="Enter patient's full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />

                </div>

              </div>


              {/* DATE OF BIRTH */}
              <div className="form-group">

                <label htmlFor="dateOfBirth">
                  Date of Birth <span>*</span>
                </label>

                <div className="input-wrapper">

                  <CalendarIcon />

                  <input
                    id="dateOfBirth"
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                  />

                </div>

              </div>


              {/* GENDER */}
              <div className="form-group">

                <label htmlFor="gender">
                  Gender <span>*</span>
                </label>

                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >

                  <option value="">
                    Select gender
                  </option>

                  <option value="Female">
                    Female
                  </option>

                  <option value="Male">
                    Male
                  </option>

                  <option value="Other">
                    Other
                  </option>

                </select>

              </div>


              {/* BLOOD GROUP */}
              <div className="form-group">

                <label htmlFor="bloodGroup">
                  Blood Group <span>*</span>
                </label>

                <select
                  id="bloodGroup"
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  required
                >

                  <option value="">
                    Select blood group
                  </option>

                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>

                </select>

              </div>


              {/* PHONE */}
              <div className="form-group">

                <label htmlFor="phone">
                  Phone Number <span>*</span>
                </label>

                <div className="input-wrapper">

                  <PhoneIcon />

                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    placeholder="+91 XXXXX XXXXX"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />

                </div>

              </div>


              {/* EMERGENCY CONTACT */}
              <div className="form-group full-width">

                <label htmlFor="emergencyContact">
                  Emergency Contact <span>*</span>
                </label>

                <div className="input-wrapper">

                  <PhoneIcon />

                  <input
                    id="emergencyContact"
                    type="tel"
                    name="emergencyContact"
                    placeholder="Emergency contact number"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    required
                  />

                </div>

              </div>

            </div>

          </div>


          {/* SECURITY MESSAGE */}
          <div className="privacy-message">

            <ShieldIcon />

            <div>

              <strong>
                Your patient's information is secure
              </strong>

              <p>
                All patient data is encrypted and protected
                with enterprise-grade security.
              </p>

            </div>

          </div>


          {/* BUTTONS */}
          <div className="form-actions">

            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate("/dashboard")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="create-patient-button"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Patient"}
            </button>

          </div>

        </form>

      </main>

    </div>
  );
}

export default NewPatient;