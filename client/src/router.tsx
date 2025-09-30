import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./auth/AuthPage";
import { useAuth } from "./auth/AuthContext";
import AdminPage from "./admin/AdminPage";
import DashboardPage from "./dashboard/DashboardPage";
import ParentPage from "./parent/ParentPage";
import Landing from "./App";
import {JSX} from "react"; // 👈 your marketing/landing page

function Protected({
  children,
}: {
  children: JSX.Element;
}) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Landing />} />                {/* 👈 landing page */}
        <Route path="/auth" element={<AuthPage />} />           {/* login/signup */}

        {/* PROTECTED ROUTES */}
        <Route
          path="/admin"
          element={
            <Protected>
              <AdminPage />
            </Protected>
          }
        />
        <Route
          path="/dashboard"
          element={
            <Protected>
              <DashboardPage />
            </Protected>
          }
        />
        <Route
          path="/parent"
          element={
            <Protected>
              <ParentPage />
            </Protected>
          }
        />

        {/* FALLBACK → go to landing, not /auth */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}