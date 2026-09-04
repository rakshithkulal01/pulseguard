import { Routes, Route } from "react-router-dom";
import Landing from "../pages/Landing";
import Dashboard from "../pages/Dashboard";
import NewPatient from "../pages/NewPatient";
import PatientProfile from "../pages/PatientProfile";
import Settings from "../pages/Settings";
import ProtectedRoute from "../components/common/ProtectedRoute";
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Landing />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/new-patient" element={<NewPatient />} />
        <Route path="/dashboard/profile" element={<PatientProfile />} />
        <Route path="/dashboard/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
