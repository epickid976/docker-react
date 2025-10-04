import { useAuth } from "../auth/AuthContext";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function AdminPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'analytics' | 'settings' | 'moderation'>('users');

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h1>GoutDeau Admin</h1>
        <Link to="/dashboard" style={{ color: '#2563eb', textDecoration: 'none' }}>← Back to app</Link>
      </div>
      <p style={{ opacity: 0.7 }}>Signed in as {profile?.display_name || user?.email}</p>

      {/* Tabs */}
      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        {[
          { key: 'users', label: 'User Management' },
          { key: 'analytics', label: 'Analytics' },
          { key: 'settings', label: 'System Settings' },
          { key: 'moderation', label: 'Content Moderation' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              background: activeTab === tab.key ? '#eff6ff' : 'white',
              color: activeTab === tab.key ? '#1d4ed8' : '#0f172a',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div style={{ marginTop: 16, padding: 24, border: "1px solid #e5e7eb", borderRadius: 8 }}>
        {activeTab === 'users' && (
          <div>
            <h2>User Management</h2>
            <p>Search users, view profiles, toggle roles, and deactivate accounts.</p>
            <ul>
              <li>Search by email/name</li>
              <li>View hydration stats summary</li>
              <li>Grant/revoke admin</li>
              <li>Deactivate/reactivate user</li>
            </ul>
          </div>
        )}
        {activeTab === 'analytics' && (
          <div>
            <h2>App Analytics</h2>
            <p>Overview of DAU/WAU, entries/day, average goal completion, retention.</p>
          </div>
        )}
        {activeTab === 'settings' && (
          <div>
            <h2>System Settings</h2>
            <p>Feature flags, rate limits, maintenance mode, and environment info.</p>
          </div>
        )}
        {activeTab === 'moderation' && (
          <div>
            <h2>Content Moderation</h2>
            <p>Review notes/imports, handle abuse reports, and audit logs.</p>
          </div>
        )}
      </div>
    </div>
  );
}