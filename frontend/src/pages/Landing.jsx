import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import heartImage from "../assets/images/pulseguard-heart-reference.png";
import "../style.css";
import { notify } from "../utils/notifications";
function Icon({ type }) {
  const paths = {
    shield: (
      <>
        <path d="M12 3L20 6V11C20 16 16.5 20 12 21C7.5 20 4 16 4 11V6L12 3Z" />
        <path d="M9 12L11 14L15 10" />
      </>
    ),
    pulse: <path d="M3 12H7L9 7L13 17L15 12H21" />,
    family: (
      <>
        <circle cx="9" cy="9" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M3 20C3 16.7 5.7 14 9 14C12.3 14 15 16.7 15 20" />
        <path d="M15 15C18.3 14.3 21 16.5 21 20" />
      </>
    ),
    report: (
      <>
        <path d="M14 3V8H19" />
        <path d="M5 3H14L19 8V21H5V3Z" />
        <path d="M9 16L11 13L13 15L16 11" />
      </>
    ),
  };
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
      {paths[type]}
    </svg>
  );
}
export default function Landing() {
  const navigate = useNavigate();
  const { session, loginWithGoogle } = useAuth();
  const signIn = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      notify.error(error?.message || "Google sign-in could not be started.");
    }
  };
  const features = [
    {
      icon: "shield",
      title: "AI-Powered Monitoring",
      text: "Advanced AI detects abnormalities and provides real-time insights.",
    },
    {
      icon: "pulse",
      title: "Secure & Private",
      text: "Your data is encrypted and protected with enterprise-grade security.",
    },
    {
      icon: "family",
      title: "Family Health Tracking",
      text: "Monitor and manage the heart health of your loved ones in one place.",
    },
    {
      icon: "report",
      title: "Detailed Reports",
      text: "Get accurate reports and trends to make informed health decisions.",
    },
  ];
  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="brand-logo">
            <svg
              viewBox="0 0 80 64"
              width="64"
              height="64"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path d="M40 52C37 49 13 34 13 20C13 12 19 7 26 7C32 7 37 10 40 16C43 10 48 7 54 7C61 7 67 12 67 20C67 34 43 49 40 52Z" />
              <path d="M13 30H26L31 22L37 38L43 20L48 30H67" />
            </svg>
          </div>
          <div className="brand-content">
            <div className="brand-name">PulseGuard</div>
            <div className="brand-subtitle">AI HEALTH PLATFORM</div>
          </div>
        </div>
      </header>
      <main className="main-container">
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
          <button type="button" className="google-button" onClick={signIn}>
            <span className="google-icon">G</span>
            <span>Sign in with Google</span>
          </button>
          <div className="security">
            <span>♙</span>
            <span>HIPAA Compliant &amp; Secure</span>
          </div>
        </section>
        <section className="right-side">
          <div className="why-card">
            <h2>Why PulseGuard?</h2>
            <div className="feature-list">
              {features.map((feature) => (
                <div className="feature" key={feature.title}>
                  <div className="feature-icon">
                    <Icon type={feature.icon} />
                  </div>
                  <div className="feature-text">
                    <h3>{feature.title}</h3>
                    <p>{feature.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="trusted">
              <span>♙</span>
              <span>Built for families. Powered by AI.</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
