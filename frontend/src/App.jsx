import "./style.css";
import heartImage from "./assets/images/pulseguard-heart-reference.png";

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path
        d="M12 3L20 6V11C20 16 16.8 20 12 21C7.2 20 4 16 4 11V6L12 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 12L10.5 14.5L16 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PulseIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path
        d="M2 12H6L8.5 7L12 17L15 9L17 12H22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FamilyIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle
        cx="9"
        cy="8"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <circle
        cx="17"
        cy="9"
        r="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M3 20C3 16.7 5.7 14 9 14C12.3 14 15 16.7 15 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M15 15C18.3 14.3 21 16.5 21 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path
        d="M6 3H14L19 8V21H6V3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M14 3V8H19"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M9 16L11 13L13 15L16 11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect
        x="5"
        y="10"
        width="14"
        height="11"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M8 10V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle
        cx="12"
        cy="8"
        r="3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M5 21C5.5 16.8 8.2 14.5 12 14.5C15.8 14.5 18.5 16.8 19 21"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LogoHeart() {
  return (
    <svg viewBox="0 0 80 80" className="logo-heart-svg">
      <path
        d="M40 65
        C36 60 16 46 12 32
        C8 18 20 10 31 15
        C36 17 39 22 40 26
        C41 22 44 17 49 15
        C60 10 72 18 68 32
        C64 46 44 60 40 65Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />

      <path
        d="M13 40H27L32 31L38 49L44 30L49 40H67"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function App() {
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
    <div className="page">

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


          {/* GOOGLE */}
          <button className="google-button">

            <span className="google-icon">
              G
            </span>

            <span>
              Sign in with Google
            </span>

          </button>


          {/* OR */}
          <div className="or-section">

            <div></div>

            <span>OR</span>

            <div></div>

          </div>


          {/* SIGN IN */}
          <button className="signin-button">

            <UserIcon />

            <span>
              Sign In
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