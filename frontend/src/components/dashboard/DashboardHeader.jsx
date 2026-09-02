import { useAuth } from "../../hooks/useAuth";

export default function DashboardHeader({ search, onSearch }) {
  const { user } = useAuth();

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";

  return (
    <section className="welcome-section">
      <div className="welcome-content">
        <h2>Welcome, {userName} 👋</h2>
      </div>
      <div className="search-box">
        <span className="search-icon">⌕</span>
        <input
          aria-label="Search patients"
          type="text"
          placeholder="Search patients..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
    </section>
  );
}
