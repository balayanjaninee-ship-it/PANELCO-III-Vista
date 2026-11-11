import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import VehicleAvailability from "./pages/Vehicle Availability";
import VehicleManagement from "./pages/Vehicle Management";
import VehicleMonitoring from "./pages/Vehicle Monitoring";
import UserManagement from "./pages/User Management";
import Settings from "./pages/Settings";
import "./index.css";

function RoleGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, hasAccess } = useAuth();
  const location = useLocation();
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }
  if (!hasAccess(location.pathname)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <RoleGuard>
                <Dashboard />
              </RoleGuard>
            }
          />
          <Route
            path="/vehicle-availability"
            element={
              <RoleGuard>
                <VehicleAvailability />
              </RoleGuard>
            }
          />
          <Route
            path="/vehicle-management"
            element={
              <RoleGuard>
                <VehicleManagement initialVehicles={[]} initialMaintenance={[]} />
              </RoleGuard>
            }
          />
          <Route
            path="/vehicle-monitoring"
            element={
              <RoleGuard>
                <VehicleMonitoring />
              </RoleGuard>
            }
          />
          <Route
            path="/user-management"
            element={
              <RoleGuard>
                <UserManagement />
              </RoleGuard>
            }
          />
          <Route
            path="/settings"
            element={
              <RoleGuard>
                <Settings />
              </RoleGuard>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
);
