import React from "react";
import {
  getInitials,
  mapBloodGroup,
  mapGender,
  getCardType,
} from "../../../../../../utils/patientFormatters";

function PatientCard({
  patient,
  index,
  onViewHistory,
}) {
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
      onClick={() => onViewHistory(patient)}
      style={{ cursor: "pointer" }}
    >

      {/* TOP */}
      <div className="patient-card-top">

        <div className="patient-status">
          <span>•</span>
          Active
        </div>

        <button
          className="more-button"
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          •••
        </button>

      </div>


      {/* AVATAR */}
      <div className="patient-avatar">
        {getInitials(patient.fullName)}
      </div>


      {/* NAME */}
      <h3>{patient.fullName}</h3>


      {/* PATIENT DETAILS */}
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


      {/* MONITORING */}
      <div className="monitoring-details">

        <div className="monitor-item">

          <span className="heart-icon">
            ♥
          </span>

          <div>
            <b>{bpmDisplay}</b>
            <span>Last Reading</span>
          </div>

        </div>


        <div className="monitor-item">

          <span className="calendar-icon">
            ▣
          </span>

          <div>
            <b>{monitoredDisplay}</b>
            <span>Last Monitored</span>
          </div>

        </div>

      </div>


      {/* HISTORY BUTTON */}
      <button
        className="history-button"
        onClick={(event) => {
          event.stopPropagation();
          onViewHistory(patient);
        }}
      >
        View History
        <span>→</span>
      </button>

    </div>
  );
}

export default PatientCard;