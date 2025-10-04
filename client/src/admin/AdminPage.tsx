import { useAuth } from "../auth/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function AdminPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'analytics' | 'settings' | 'moderation'>('users');
  const isAdmin = useMemo(() => (profile as any)?.role === 'SYSTEM_ADMIN' || (profile as any)?.is_admin === true, [profile]);

  // --------------- Users Tab State ---------------
  const [userSearch, setUserSearch] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  async function loadUsers() {
    try {
      setUsersLoading(true);
      setUsersError(null);
      const query = supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(20);
      if (userSearch.trim()) {
        // Search by display_name (case-insensitive); fallback to user_id fragment
        query.ilike('display_name', `%${userSearch}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      setUsersError(err.message || 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }

  async function toggleAdmin(targetUserId: string, next: boolean) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: next, role: next ? 'SYSTEM_ADMIN' : null })
      .eq('user_id', targetUserId);
    if (!error) {
      setUsers(prev => prev.map(u => u.user_id === targetUserId ? { ...u, is_admin: next, role: next ? 'SYSTEM_ADMIN' : null } : u));
    }
    return error;
  }

  async function fetchUser7DayCount(targetUserId: string): Promise<number> {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('hydration_entries')
      .select('id, entry_ts')
      .eq('user_id', targetUserId)
      .gte('entry_ts', since)
      .limit(1000);
    if (error) return 0;
    return (data || []).length;
  }

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // --------------- Analytics Tab State ---------------
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analytics, setAnalytics] = useState<{ totalUsers: number; dau: number; entriesToday: number; last7: { date: string; count: number }[] } | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  async function loadAnalytics() {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError(null);

      // total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // entries today + DAU
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const { data: todaysEntries } = await supabase
        .from('hydration_entries')
        .select('user_id, entry_ts')
        .gte('entry_ts', startOfDay.toISOString());
      const entriesToday = (todaysEntries || []).length;
      const dau = new Set((todaysEntries || []).map(r => r.user_id)).size;

      // last 7 days series
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const { data: last7Entries } = await supabase
        .from('hydration_entries')
        .select('entry_ts')
        .gte('entry_ts', since.toISOString());
      const buckets: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        buckets[key] = 0;
      }
      (last7Entries || []).forEach(r => {
        const key = new Date(r.entry_ts).toISOString().slice(0, 10);
        if (key in buckets) buckets[key] += 1;
      });
      const series = Object.entries(buckets)
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([date, count]) => ({ date, count }));

      setAnalytics({ totalUsers: usersCount || 0, dau, entriesToday, last7: series });
    } catch (err: any) {
      setAnalyticsError(err.message || 'Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // --------------- Moderation Tab State ---------------
  const [modLoading, setModLoading] = useState(false);
  const [modEntries, setModEntries] = useState<any[]>([]);
  const [modError, setModError] = useState<string | null>(null);

  async function loadModeration() {
    try {
      setModLoading(true);
      setModError(null);
      const { data, error } = await supabase
        .from('hydration_entries')
        .select('id, user_id, note, entry_ts, amount_ml')
        .not('note', 'is', null)
        .order('entry_ts', { ascending: false })
        .limit(50);
      if (error) throw error;
      setModEntries(data || []);
    } catch (err: any) {
      setModError(err.message || 'Failed to load items');
    } finally {
      setModLoading(false);
    }
  }

  async function redactNote(entryId: number) {
    const { error } = await supabase
      .from('hydration_entries')
      .update({ note: null })
      .eq('id', entryId);
    if (!error) setModEntries(prev => prev.filter(e => e.id !== entryId));
  }

  async function deleteEntry(entryId: number) {
    const { error } = await supabase
      .from('hydration_entries')
      .delete()
      .eq('id', entryId);
    if (!error) setModEntries(prev => prev.filter(e => e.id !== entryId));
  }

  useEffect(() => {
    if (activeTab === 'moderation') {
      loadModeration();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // --------------- Settings Tab State ---------------
  const [health, setHealth] = useState<{ status: string; connections: number } | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [flags, setFlags] = useState({ smartRecommendations: getFlag('smartRecommendations'), wearableSync: getFlag('wearableSync') });

  function getFlag(key: string) {
    try { return localStorage.getItem(`flag:${key}`) === '1'; } catch { return false; }
  }
  function setFlag(key: string, value: boolean) {
    try { localStorage.setItem(`flag:${key}`, value ? '1' : '0'); } catch {}
  }

  async function loadHealth() {
    try {
      setHealthError(null);
      const res = await fetch('/health');
      const json = await res.json();
      setHealth({ status: json.status, connections: json.connections });
    } catch (err: any) {
      setHealthError(err.message || 'Failed to reach /health');
    }
  }

  useEffect(() => {
    if (activeTab === 'settings') {
      loadHealth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h1>GoutDeau Admin</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={async () => { await supabase.auth.signOut(); }} style={{ color: '#dc2626', background: 'transparent', border: '1px solid #fecaca', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}>Log out</button>
          <Link to="/dashboard" style={{ color: '#2563eb', textDecoration: 'none' }}>← Back to app</Link>
        </div>
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
            <h2 style={{ marginBottom: 12 }}>User Management</h2>
            {!isAdmin && <div style={{ color: '#b91c1c', marginBottom: 12 }}>You do not have admin permissions.</div>}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                placeholder="Search by name…"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 8, minWidth: 240 }}
              />
              <button onClick={loadUsers} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer' }}>Search</button>
            </div>
            {usersLoading && <div>Loading users…</div>}
            {usersError && <div style={{ color: '#b91c1c' }}>{usersError}</div>}
            <div style={{ display: 'grid', gap: 8 }}>
              {users.map((u) => (
                <div key={u.user_id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{u.display_name || '(no name)'}</div>
                    <div style={{ opacity: 0.7, fontSize: 12 }}>{u.user_id}</div>
                    <User7d userId={u.user_id} fetchCount={fetchUser7DayCount} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, opacity: 0.8 }}>{u.is_admin ? 'Admin' : 'User'}</span>
                    <button
                      onClick={async () => {
                        const next = !u.is_admin;
                        const err = await toggleAdmin(u.user_id, next);
                        if (err) alert('Failed to update admin: ' + err.message);
                      }}
                      style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer' }}
                    >
                      {u.is_admin ? 'Revoke admin' : 'Make admin'}
                    </button>
                  </div>
                </div>
              ))}
              {(!usersLoading && users.length === 0) && <div style={{ opacity: 0.7 }}>No users found.</div>}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <h2 style={{ marginBottom: 12 }}>App Analytics</h2>
            {analyticsLoading && <div>Loading…</div>}
            {analyticsError && <div style={{ color: '#b91c1c' }}>{analyticsError}</div>}
            {analytics && (
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <Metric label="Total Users" value={analytics.totalUsers} />
                  <Metric label="DAU (today)" value={analytics.dau} />
                  <Metric label="Entries Today" value={analytics.entriesToday} />
                </div>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Entries (last 7 days)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 8 }}>
                    {analytics.last7.map((d) => (
                      <div key={d.date} style={{ textAlign: 'center' }}>
                        <div style={{ height: 60, background: '#eff6ff', border: '1px solid #e5e7eb', borderRadius: 6, position: 'relative' }}>
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: Math.min(56, d.count) , background: '#3b82f6', borderRadius: 6 }} />
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{d.date.slice(5)}</div>
                        <div style={{ fontSize: 12 }}>{d.count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h2 style={{ marginBottom: 12 }}>System Settings</h2>
            <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={flags.smartRecommendations}
                  onChange={(e) => { const v = e.target.checked; setFlags(s => ({ ...s, smartRecommendations: v })); setFlag('smartRecommendations', v); }}
                />
                Smart Recommendations
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={flags.wearableSync}
                  onChange={(e) => { const v = e.target.checked; setFlags(s => ({ ...s, wearableSync: v })); setFlag('wearableSync', v); }}
                />
                Wearable Sync
              </label>
            </div>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Environment & Health</div>
              <div style={{ marginBottom: 6 }}>Env: {process.env.NODE_ENV}</div>
              <button onClick={loadHealth} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer', marginBottom: 8 }}>Check /health</button>
              {healthError && <div style={{ color: '#b91c1c' }}>{healthError}</div>}
              {health && (
                <div>
                  <div>Status: {health.status}</div>
                  <div>WebSocket connections: {health.connections}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'moderation' && (
          <div>
            <h2 style={{ marginBottom: 12 }}>Content Moderation</h2>
            {modLoading && <div>Loading…</div>}
            {modError && <div style={{ color: '#b91c1c' }}>{modError}</div>}
            <div style={{ display: 'grid', gap: 8 }}>
              {modEntries.map((e) => (
                <div key={e.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{new Date(e.entry_ts).toLocaleString()}</div>
                    <div style={{ opacity: 0.8, marginTop: 4 }}>User: {e.user_id}</div>
                    <div style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{e.note}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => redactNote(e.id)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer' }}>Redact note</button>
                    <button onClick={() => { if (confirm('Delete entry?')) deleteEntry(e.id); }} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #fecaca', color: '#b91c1c', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              ))}
              {(!modLoading && modEntries.length === 0) && <div style={{ opacity: 0.7 }}>No items with notes.</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, minWidth: 140 }}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function User7d({ userId, fetchCount }: { userId: string; fetchCount: (id: string) => Promise<number> }) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => { let mounted = true; fetchCount(userId).then(c => { if (mounted) setCount(c); }); return () => { mounted = false; }; }, [userId]);
  return <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>Entries last 7 days: {count ?? '…'}</div>;
}