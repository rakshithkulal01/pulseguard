import React from "react";
import { Routes, Route } from "react-router-dom";

import App from "../App";
import Dashboard from "../pages/Landing/Login/Dashboard/Dashboard";
import NewPatient from "../pages/Landing/Login/Dashboard/NewPatient";

function AppRoutes() {
  return (
    <Routes>

      {/* PAGE 1 */}
      <Route
        path="/"
        element={<App />}
      />

      {/* PAGE 2 */}
      <Route
        path="/dashboard"
        element={<Dashboard />}
      />

      {/* PAGE 3 */}
      <Route
        path="/dashboard/new-patient"
        element={<NewPatient />}
      />

    </Routes>
  );
}

export default AppRoutes;