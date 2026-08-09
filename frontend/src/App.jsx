import React, { useEffect } from "react";
import "./style.css";
import heartImage from "./assets/images/pulseguard-heart-reference.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { supabase } from "./utils/supabase";

/* ================= ICONS ================= */

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="30"
      height="30"
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

function PulseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="30"
      height="30"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12H7L9 7L13 17L15 12H21" />
    </svg>
  );
}

function FamilyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="30"
      height="30"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="9" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 20C3 16.7 5.7 14 9 14C12.3 14 15 16.7 15 20" />
      <path d="M15 15C18.3 14.3 21 16.5 21 20" />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="30"
      height="30"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 3V8H19" />
      <path d="M5 3H14L19 8V21H5V3Z" />
      <path d="M9 16L11 13L13 15L16 11" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V10" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="7" r="3.5" />
      <path d="M5 21C5.5 16.8 8.2 14.5 12 14.5C15.8 14.5 18.5 16.8 19 21" />
    </svg>
  );
}

function LogoHeart() {
  return (
    <svg
      viewBox="0 0 80 64"
      width="64"
      height="64"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M40 52C37 49 13 34 13 20C13 12 19 7 26 7C32 7 37 10 40 16C43 10 48 7 54 7C61 7 67 12 67 20C67 34 43 49 40 52Z" />
      <path d="M13 30H26L31 22L37 38L43 20L48 30H67" />
    </svg>
  );
}


/* ================= APP ================= */

function App() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session) {
      navigate("/dashboard");
    }
  }, [session, loading, navigate]);

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/dashboard",
      },
    });
    if (error) {
      alert("Error logging in: " + error.message);
    }
  };

  const features = [
    {
      icon: <ShieldIcon />,
      title: "AI-Powered Monitoring",
      text: "Advanced AI detects abnormalities and provides real-time insights.",
    },
    {
      icon: <PulseIcon />,
      title: "Secure & Private",
      text: "Your data is encrypted and protected with enterprise-grade security.",
    },
    {
      icon: <FamilyIcon />,
      title: "Family Health Tracking",
      text: "Monitor and manage the heart health of your loved ones in one place.",
    },
    {
      icon: <ReportIcon />,
      title: "Detailed Reports",
      text: "Get accurate reports and trends to make informed health decisions.",
    },
  ];

  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">

        <div className="brand">

          <div className="brand-logo">
            <LogoHeart />
          </div>

          <div className="brand-content">

            <div className="brand-name">
              PulseGuard
            </div>

            <div className="brand-subtitle">
              AI HEALTH PLATFORM
            </div>

          </div>

        </div>

      </header>


      {/* MAIN */}
      <main className="main-container">

        {/* LEFT SIDE */}
        <section className="left-side">

          <div className="heart-container">

            <img
              src={heartImage}
              alt="PulseGuard anatomical heart"
              className="heart-image"
            />

          </div>


          <div className="welcome-section">

            <h1>
              Welcome to <span>PulseGuard</span>
            </h1>

            <p>
              Secure your family's cardiac health
              <br />
              with AI-powered monitoring.
            </p>

          </div>


         <button
  className="google-button"
  onClick={handleGoogleLogin}
>
  <span className="google-icon">
    G
  </span>

  <span>
    Sign in with Google
  </span>
</button>


         


          



          {/* SECURITY */}
          <div className="security">

            <LockIcon />

            <span>
              HIPAA Compliant &amp; Secure
            </span>

          </div>

        </section>


        {/* RIGHT SIDE */}
        <section className="right-side">

          <div className="why-card">

            <h2>
              Why PulseGuard?
            </h2>


            <div className="feature-list">

              {features.map((feature, index) => (

                <div
                  className="feature"
                  key={index}
                >

                  <div className="feature-icon">
                    {feature.icon}
                  </div>

                  <div className="feature-text">

                    <h3>
                      {feature.title}
                    </h3>

                    <p>
                      {feature.text}
                    </p>

                  </div>

                </div>

              ))}

            </div>


            {/* TRUSTED */}
            <div className="trusted">

              <LockIcon />

              <span>
                Trusted by doctors. Loved by families.
              </span>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default App;