import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import AuthPage from "./auth/AuthPage";
import { useAuth } from "./auth/AuthContext";
import AdminPage from "./admin/AdminPage";
import { useMemo } from "react";
import DashboardPage from "./dashboard/DashboardPage";
import ParentPage from "./parent/ParentPage";
import Landing from "./App";
import {JSX} from "react";
import { notificationService } from "./services/NotificationService";
import { supabase } from "./supabaseClient"; // 👈 your marketing/landing page

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

function AdminOnly({ children }: { children: JSX.Element }) {
  const { user, profile, loading } = useAuth();
  const isAdmin = useMemo(() => {
    const role = (profile as any)?.role;
    const flag = (profile as any)?.is_admin;
    return role === 'SYSTEM_ADMIN' || flag === true;
  }, [profile]);
  if (loading) return <div>Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function AppRouter() {
  // Notification service management - keep active throughout the session
  useEffect(() => {
    console.log('🚀 AppRouter useEffect triggered - initializing services');
    
    const initializeServices = async () => {
      try {
        console.log('🔧 Starting service initialization...');
        
        // Initialize notification service
        await notificationService.initialize();
        console.log('🔔 Notification service initialized for app session');
      } catch (error) {
        console.error('❌ Failed to initialize services:', error);
      }
    };

    // Initialize when app loads
    console.log('🚀 Calling initializeServices...');
    initializeServices();

    // Cleanup on unmount
    return () => {
      notificationService.destroy();
    };
  }, []);

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
            <AdminOnly>
              <AdminPage />
            </AdminOnly>
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