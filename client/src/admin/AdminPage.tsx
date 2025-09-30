import { useAuth } from "../auth/AuthContext";

export default function AdminPage() {
  const { user, profile } = useAuth();

  return (
    <div style={{ padding: 24 }}>
      <h1>GoutDeau Admin</h1>
      <p style={{ opacity: 0.7 }}>Signed in as {profile?.display_name || user?.email}</p>

      <div style={{ marginTop: 24, padding: 24, border: "1px solid #e5e7eb", borderRadius: 8 }}>
        <h2>🚧 Admin Panel Coming Soon</h2>
        <p>This admin panel will be updated with water tracking app management features.</p>
        <p>Features will include:</p>
        <ul>
          <li>User management</li>
          <li>App analytics</li>
          <li>System settings</li>
          <li>Content moderation</li>
        </ul>
      </div>
    </div>
  );
}