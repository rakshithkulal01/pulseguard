import { Outlet } from "react-router-dom";

// Authentication is intentionally bypassed for the current local/demo frontend.
// Real authentication can be restored later without changing the page routes.
export default function ProtectedRoute() {
  return <Outlet />;
}
