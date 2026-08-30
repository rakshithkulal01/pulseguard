import { Search } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export default function DashboardHeader({ search, onSearch }) {
  const { user } = useAuth();
  const doctorName = user?.user_metadata?.full_name || user?.user_metadata?.name || "Sarah Chen";

  return (
    <section className="welcome-section" aria-labelledby="dashboard-welcome-title">
      <div className="welcome-content">
        <p className="welcome-small">Welcome back,</p>
        <h2 id="dashboard-welcome-title">
          Dr. {doctorName} <span aria-hidden="true">👋</span>
        </h2>
        <p className="welcome-description">
          Select a patient profile to view health insights and monitoring data.
        </p>
      </div>

      <label className="search-box">
        <Search className="search-icon" size={18} strokeWidth={2} aria-hidden="true" />
        <input
          aria-label="Search patients"
          type="search"
          placeholder="Search patients..."
          value={search}
          onChange={(event) => onSearch(event.target.value)}
        />
      </label>
    </section>
  );
}
