import React from "react";

function AddPatientCard({ onClick }) {
  return (
    <button
      className="new-patient-card"
      onClick={onClick}
    >
      <div className="new-patient-icon">
        ♙+
      </div>

      <h3>
        Add New Patient
      </h3>

      <p>
        Create a new patient profile
        <br />
        to start monitoring.
      </p>
    </button>
  );
}

export default AddPatientCard;