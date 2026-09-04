import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import "./Settings.css";
export default function Settings() {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  return (
    <div className={`settings-page ${darkMode ? "dark-mode" : ""}`}>
      <div className="settings-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your PulseGuard preferences and account settings.</p>
        </div>
      </div>
      <section className="settings-section">
        <Heading
          icon="👤"
          title="Account"
          subtitle="Manage your account information"
        />
        <div className="settings-card">
          <div className="profile-row">
            <div className="profile-avatar">
              {(user?.user_metadata?.full_name || user?.email || "PG")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="profile-info">
              <h3>
                {user?.user_metadata?.full_name ||
                  user?.email?.split("@")[0] ||
                  "PulseGuard User"}
              </h3>
            </div>
          </div>
          <div className="divider" />
          <div className="info-row">
            <div>
              <span className="info-label">Email</span>
              <span className="info-value">
                {user?.email || "Not available"}
              </span>
            </div>
          </div>
        </div>
      </section>
      <section className="settings-section">
        <Heading
          icon="🎨"
          title="Appearance"
          subtitle="Customize how PulseGuard looks"
        />
        <div className="settings-card">
          <Setting
            title="Dark Mode"
            text="Use a darker appearance throughout the application."
            active={darkMode}
            onClick={() => setDarkMode((v) => !v)}
          />
        </div>
      </section>
      <section className="settings-section">
        <Heading
          icon="🛡️"
          title="Data & Privacy"
          subtitle="Manage your data preferences"
        />
        <div className="settings-card">
          <div className="privacy-message">
            <div className="privacy-icon">✓</div>
            <div>
              <h3>Your data is protected</h3>
              <p>
                Patient information is handled securely within the PulseGuard
                platform.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
function Heading({ icon, title, subtitle }) {
  return (
    <div className="section-heading">
      <div className="section-icon">{icon}</div>
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}
function Setting({ title, text, active, onClick }) {
  return (
    <div className="setting-item">
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
      {onClick && (
        <button
          className={`toggle ${active ? "active" : ""}`}
          onClick={onClick}
          aria-label={`Toggle ${title}`}
        >
          <span />
        </button>
      )}
    </div>
  );
}
