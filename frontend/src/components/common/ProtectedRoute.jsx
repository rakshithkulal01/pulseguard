import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Loader from "./Loader";
export default function ProtectedRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loader label="Checking your session..." />;
  if (!session) return <Navigate to="/" replace state={{ from: location }} />;
  return <Outlet />;
}
