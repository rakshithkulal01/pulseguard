import { useAuth } from "../../hooks/useAuth";

export default function DashboardHeader({ search, onSearch }) {
  const { user } = useAuth();
  const doctorName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "User";

  return (
    <section className="welcome-section">
      <div className="welcome-content">
        <p className="welcome-small">Welcome back,</p>
        <h2>Dr. {doctorName} <span>👋</span></h2>
        <p className="welcome-description">Select a patient profile to view health insights, monitor cardiac metrics, or generate reports.</p>
      </div>
      <div className="search-box">
        <span className="search-icon">⌕</span>
        <input aria-label="Search patients" type="text" placeholder="Search patients..." value={search} onChange={(e) => onSearch(e.target.value)} />
      </div>
    </section>
  );
}
