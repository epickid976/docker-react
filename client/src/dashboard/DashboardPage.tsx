import { useAuth } from "../auth/AuthContext";

export default function DashboardPage() {
  const { user, profile } = useAuth();

  return (
    <div style={{ padding: 24 }}>
      <h1>💧 GoutDeau Dashboard</h1>
      <p style={{ opacity: 0.7 }}>Welcome back, {profile?.display_name || user?.email}</p>

      <div style={{ marginTop: 24, padding: 24, border: "1px solid #e5e7eb", borderRadius: 8 }}>
        <h2>🚧 Water Tracking Dashboard Coming Soon</h2>
        <p>Your personalized water tracking dashboard is being built!</p>
        <p>Features will include:</p>
        <ul>
          <li>Daily water intake tracking</li>
          <li>Hydration goals and progress</li>
          <li>Achievements and streaks</li>
          <li>Weekly and monthly analytics</li>
          <li>Reminder settings</li>
          <li>Social features and challenges</li>
        </ul>
        
        <div style={{ marginTop: 16, padding: 16, backgroundColor: "#f0f9ff", borderRadius: 8, border: "1px solid #0ea5e9" }}>
          <h3 style={{ margin: 0, color: "#0c4a6e" }}>💡 Stay Hydrated!</h3>
          <p style={{ margin: "8px 0 0 0", color: "#0c4a6e" }}>
            While we build your dashboard, remember to drink water regularly throughout the day!
          </p>
        </div>
      </div>
    </div>
  );
}