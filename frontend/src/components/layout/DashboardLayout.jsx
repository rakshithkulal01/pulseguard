import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ROUTES } from "../../constants/routes";
import heartImage from "../../assets/images/pulseguard-heart-reference.png";

export default function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const handleLogout = async () => {
    try {
      await logout();
      navigate(ROUTES.HOME, { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-logo">
          <div className="dashboard-logo-icon">
            <img src={heartImage} alt="PulseGuard" />
          </div>
          <div>
            <h1>PulseGuard</h1>
            <p>AI HEALTH PLATFORM</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="settings-button"
            onClick={() => navigate(ROUTES.SETTINGS)}
          >
            <span>⚙</span>Settings
          </button>
          <div className="header-divider" />
          <button className="logout-button" onClick={handleLogout}>
            <span>⇥</span>Logout
          </button>
        </div>
      </header>
      {children}
      <footer className="dashboard-footer">
        <p>© 2026 PulseGuard AI Health Platform. All rights reserved.</p>
        <span>Version 1.0.0</span>
      </footer>
    </div>
  );
}

export const DashboardWelcome = ({ search, onSearch }) => (
  <section className="welcome-section">
    <div className="welcome-content">
      <h2>Welcome 👋</h2>
    </div>
    <div className="search-box">
      <span className="search-icon">⌕</span>
      <input
        type="text"
        placeholder="Search patients..."
        value={search}
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  </section>
);
