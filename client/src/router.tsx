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
import { webSocketService } from "./services/WebSocketService";
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
  // WebSocket connection and notification service management - keep active throughout the session
  useEffect(() => {
    console.log('🚀 AppRouter useEffect triggered - initializing services');
    
    const initializeServices = async () => {
      try {
        console.log('🔧 Starting service initialization...');
        
        // Initialize notification service
        await notificationService.initialize();
        console.log('🔔 Notification service initialized for app session');

        // Get current user ID from Supabase
        console.log('🔍 Checking user authentication...');
        const { data: { user } } = await supabase.auth.getUser();
        console.log('🔍 App initialization - User status:', user ? 'authenticated' : 'not authenticated');
        console.log('🔍 User details:', user ? { id: user.id, email: user.email } : 'null');
        
        if (user) {
          // Only connect if not already connected
          if (!webSocketService.isConnected()) {
            console.log('🔌 Attempting to connect WebSocket for user:', user.id);
            await webSocketService.connect(user.id);
            console.log('🔌 WebSocket connected for app session');
          } else {
            console.log('🔌 WebSocket already connected');
          }
        } else {
          console.log('⚠️ No user authenticated, WebSocket connection skipped');
        }
      } catch (error) {
        console.error('❌ Failed to initialize services:', error);
      }
    };

    // Initialize when app loads
    console.log('🚀 Calling initializeServices...');
    initializeServices();

    // Listen for authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event, session ? 'user logged in' : 'user logged out');
      
      if (event === 'SIGNED_IN' && session?.user) {
        // User logged in, ensure WebSocket is connected
        console.log('🔐 User signed in, ensuring WebSocket connection for:', session.user.id);
        if (!webSocketService.isConnected()) {
          await webSocketService.connect(session.user.id);
          console.log('🔌 WebSocket connected after login');
        } else {
          console.log('🔌 WebSocket already connected after login');
        }
      } else if (event === 'SIGNED_OUT') {
        // User logged out, disconnect WebSocket
        console.log('🔐 User signed out, disconnecting WebSocket');
        webSocketService.disconnect();
        console.log('🔌 WebSocket disconnected after logout');
      }
      // Don't disconnect on INITIAL_SESSION - this is just the initial load
    });

    // Cleanup on unmount
    return () => {
      subscription.unsubscribe();
      webSocketService.disconnect();
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