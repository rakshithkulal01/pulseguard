import React from "react";
import PatientCard from "./PatientCard";
import AddPatientCard from "./AddPatientCard";

function PatientSection({
  patients,
  search,
  loading,
  onViewHistory,
  onAddPatient,
}) {

  const filteredPatients = patients.filter((patient) =>
    patient.fullName
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="patients-grid">

      {loading ? (

        <div className="loading-patients">
          Loading profiles...
        </div>

      ) : filteredPatients.length === 0 ? (

        <div className="no-patients">
          No patient profiles found.
          Create one to get started!
        </div>

      ) : (

        filteredPatients.map((patient, index) => (

          <PatientCard
            key={patient.id}
            patient={patient}
            index={index}
            onViewHistory={onViewHistory}
          />

        ))

      )}

      <AddPatientCard
        onClick={onAddPatient}
      />

    </div>
  );
}

export default PatientSection;