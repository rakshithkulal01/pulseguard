import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

import heartImage from "../../../../assets/images/pulseguard-heart-reference.png";

function Dashboard() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  const patients = [
    {
      initials: "SC",
      name: "Sarah Connor",
      age: "34 yrs",
      gender: "Female",
      blood: "A+",
      bpm: "72 BPM",
      monitored: "Today, 09:41 AM",
      type: "blue",
    },
    {
      initials: "RW",
      name: "Robert Williams",
      age: "45 yrs",
      gender: "Male",
      blood: "O+",
      bpm: "68 BPM",
      monitored: "Today, 08:30 AM",
      type: "green",
    },
  ];

  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-page">

      {/* HEADER */}
      <header className="dashboard-header">

        <div className="dashboard-logo">

          <div className="dashboard-logo-icon">
            <img
              src={heartImage}
              alt="PulseGuard"
            />
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

          <button className="logout-button">
            <span>⇥</span>
            Logout
          </button>

        </div>

      </header>


      {/* WELCOME */}
      <section className="welcome-section">

        <div className="welcome-content">

          <p className="welcome-small">
            Welcome back,
          </p>

          <h2>
            Dr. Sarah Chen <span>👋</span>
          </h2>

          <p className="welcome-description">
            Select a patient profile to view health insights and
            monitoring data.
          </p>

        </div>


        {/* SEARCH */}
        <div className="search-box">

          <span className="search-icon">
            ⌕
          </span>

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

            <div className="patients-icon">
              ♧
            </div>

            <div>

              <h2>
                My Patient Profiles
              </h2>

              <p>
                Manage and monitor your patients
              </p>

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

          {filteredPatients.map((patient) => (

            <div
              className={`patient-card ${patient.type}`}
              key={patient.name}
            >

              <div className="patient-card-top">

                <div className="patient-status">
                  <span>•</span>
                  Active
                </div>

                <button className="more-button">
                  •••
                </button>

              </div>


              <div className="patient-avatar">
                {patient.initials}
              </div>


              <h3>
                {patient.name}
              </h3>


              <div className="patient-details">

                <div className="detail-item">

                  <strong>
                    ♙
                  </strong>

                  <div>
                    <b>{patient.age}</b>
                    <span>Age</span>
                  </div>

                </div>


                <div className="detail-item">

                  <strong>
                    {patient.gender === "Female" ? "♀" : "♂"}
                  </strong>

                  <div>
                    <b>{patient.gender}</b>
                    <span>Gender</span>
                  </div>

                </div>


                <div className="detail-item">

                  <strong>
                    ♢
                  </strong>

                  <div>
                    <b>{patient.blood}</b>
                    <span>Blood Group</span>
                  </div>

                </div>

              </div>


              <div className="monitoring-details">

                <div className="monitor-item">

                  <span className="heart-icon">
                    ♥
                  </span>

                  <div>
                    <b>{patient.bpm}</b>
                    <span>Last Reading</span>
                  </div>

                </div>


                <div className="monitor-item">

                  <span className="calendar-icon">
                    ▣
                  </span>

                  <div>
                    <b>{patient.monitored}</b>
                    <span>Last Monitored</span>
                  </div>

                </div>

              </div>


              <button className="history-button">
                View History
                <span>→</span>
              </button>

            </div>

          ))}


          {/* ADD NEW PATIENT CARD */}
          <button
            className="new-patient-card"
            onClick={() => navigate("/dashboard/new-patient")}
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

        </div>


        {/* SECURITY */}
        <section className="security-banner">

          <div className="security-image">

            <div className="security-heart">
              ♥
            </div>

          </div>


          <div className="security-content">

            <h3>
              Secure <span>•</span> Private <span>•</span> Trusted
            </h3>

            <p>
              All patient data is encrypted and protected with
              enterprise-grade security.
            </p>

            <p>
              We are HIPAA compliant and committed to your privacy.
            </p>

          </div>


          <div className="hipaa-badge">

            <div className="shield-icon">
              ✓
            </div>

            <div>
              <strong>HIPAA</strong>
              <span>COMPLIANT</span>
            </div>

          </div>

        </section>

      </main>


      {/* FOOTER */}
      <footer className="dashboard-footer">

        <p>
          © 2026 PulseGuard AI Health Platform.
          All rights reserved.
        </p>

        <span>
          Version 1.0.0
        </span>

      </footer>

    </div>
  );
}

export default Dashboard;