import { LogOut, Settings } from "lucide-react";
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
        <button className="dashboard-logo" type="button" onClick={() => navigate(ROUTES.DASHBOARD)} aria-label="Go to PulseGuard dashboard">
          <span className="dashboard-logo-icon">
            <img src={heartImage} alt="" />
          </span>
          <span className="dashboard-logo-copy">
            <span className="dashboard-logo-name">PulseGuard</span>
            <span className="dashboard-logo-subtitle">AI HEALTH PLATFORM</span>
          </span>
        </button>

        <nav className="header-actions" aria-label="Dashboard actions">
          <button className="header-action" type="button" onClick={() => navigate(ROUTES.SETTINGS)}>
            <Settings size={15} strokeWidth={2.1} aria-hidden="true" />
            <span>Settings</span>
          </button>
          <span className="header-divider" aria-hidden="true" />
          <button className="header-action" type="button" onClick={handleLogout}>
            <LogOut size={15} strokeWidth={2.1} aria-hidden="true" />
            <span>Logout</span>
          </button>
        </nav>
      </header>
      {children}
      <footer className="dashboard-footer">
        <span>© 2026 PulseGuard AI Health Platform. All rights reserved.</span>
        <span>Version 1.0.0</span>
      </footer>
    </div>
  );
}
