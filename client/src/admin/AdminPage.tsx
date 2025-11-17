import { useAuth } from "../auth/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Users as UsersIcon, BarChart3, Settings as SettingsIcon, Shield, Search as SearchIcon, Crown, RefreshCcw, Check, X } from "lucide-react";

export default function AdminPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Shield className="text-blue-600" size={22} />
            </div>
            <div>
              <h1 
                className="text-2xl font-bold text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={() => navigate('/dashboard')}
              >
                GoutDeau Admin
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Signed in as {profile?.display_name || user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={async () => { await supabase.auth.signOut(); }} className="px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950 text-sm">Log out</button>
            <Link to="/dashboard" className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-blue-700 dark:text-blue-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm">← Back to app</Link>
          </div>
        </div>
      <p style={{ opacity: 0.7, marginBottom: 5}}>Signed in as {profile?.display_name || user?.email}</p>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[{ key: 'users', label: 'User Management', icon: <UsersIcon size={16} /> }, { key: 'analytics', label: 'Analytics', icon: <BarChart3 size={16} /> }, { key: 'settings', label: 'System Settings', icon: <SettingsIcon size={16} /> }, { key: 'moderation', label: 'Content Moderation', icon: <Shield size={16} /> }].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${activeTab === tab.key ? 'bg-blue-50 dark:bg-slate-800 border-blue-200 dark:border-slate-700 text-blue-700 dark:text-blue-300' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Panels */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
        {activeTab === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">User Management</h2>
                {!isAdmin && <div className="text-red-600 dark:text-red-400 text-sm">No admin permissions</div>}
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    placeholder="Search by name…"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <button onClick={loadUsers} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <RefreshCcw size={14} /> Refresh
                </button>
              </div>
              {usersLoading && <div className="text-slate-600 dark:text-slate-400">Loading users…</div>}
              {usersError && <div className="text-red-600 dark:text-red-400">{usersError}</div>}
              <div className="grid gap-3">
                {users.map((u) => (
                  <div key={u.user_id} className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900 dark:text-white">{u.display_name || '(no name)'}</span>
                        {u.is_admin && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded px-2 py-0.5">
                            <Crown size={12} /> Admin
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{u.user_id}</div>
                      <User7d userId={u.user_id} fetchCount={fetchUser7DayCount} />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          const next = !u.is_admin;
                          const err = await toggleAdmin(u.user_id, next);
                          if (err) alert('Failed to update admin: ' + err.message);
                        }}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${u.is_admin ? 'border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                      >
                        {u.is_admin ? <X size={14} /> : <Check size={14} />}
                        {u.is_admin ? 'Revoke admin' : 'Make admin'}
                      </button>
                    </div>
                  </div>
                ))}
                {(!usersLoading && users.length === 0) && <div className="text-slate-500 dark:text-slate-400">No users found.</div>}
              </div>
            </div>
        )}

        {activeTab === 'analytics' && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">App Analytics</h2>
              {analyticsLoading && <div className="text-slate-600 dark:text-slate-400">Loading…</div>}
              {analyticsError && <div className="text-red-600 dark:text-red-400">{analyticsError}</div>}
              {analytics && (
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Metric label="Total Users" value={analytics.totalUsers} />
                    <Metric label="DAU (today)" value={analytics.dau} />
                    <Metric label="Entries Today" value={analytics.entriesToday} />
                  </div>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <div className="font-semibold text-slate-900 dark:text-white mb-2">Entries (last 7 days)</div>
                    <div className="grid grid-cols-7 gap-3">
                      {analytics.last7.map((d) => (
                        <div key={d.date} className="text-center">
                          <div className="h-28 bg-blue-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded relative overflow-hidden">
                            <div className="absolute bottom-0 left-0 right-0 bg-blue-600" style={{ height: Math.min(100, d.count * 6) }} />
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{d.date.slice(5)}</div>
                          <div className="text-xs text-slate-700 dark:text-slate-300">{d.count}</div>
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
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">System Settings</h2>
              <div className="grid gap-3 mb-4">
                <ToggleRow
                  label="Smart Recommendations"
                  checked={flags.smartRecommendations}
                  onChange={(v) => { setFlags(s => ({ ...s, smartRecommendations: v })); setFlag('smartRecommendations', v); }}
                />
                <ToggleRow
                  label="Wearable Sync"
                  checked={flags.wearableSync}
                  onChange={(v) => { setFlags(s => ({ ...s, wearableSync: v })); setFlag('wearableSync', v); }}
                />
              </div>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div className="font-semibold text-slate-900 dark:text-white mb-2">Environment & Health</div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Env: {process.env.NODE_ENV}</div>
                <button onClick={loadHealth} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 mb-2">
                  <RefreshCcw size={14} /> Check /health
                </button>
                {healthError && <div className="text-red-600 dark:text-red-400">{healthError}</div>}
                {health && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-slate-700 dark:text-slate-300">Status: <span className="font-medium">{health.status}</span></div>
                    <div className="text-slate-700 dark:text-slate-300">WS connections: <span className="font-medium">{health.connections}</span></div>
                  </div>
                )}
              </div>
            </div>
        )}

        {activeTab === 'moderation' && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Content Moderation</h2>
              {modLoading && <div className="text-slate-600 dark:text-slate-400">Loading…</div>}
              {modError && <div className="text-red-600 dark:text-red-400">{modError}</div>}
              <div className="grid gap-3">
                {modEntries.map((e) => (
                  <div key={e.id} className="flex items-start justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{new Date(e.entry_ts).toLocaleString()}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">User: {e.user_id}</div>
                      <div className="mt-3 text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{e.note}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => redactNote(e.id)} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm">Redact note</button>
                      <button onClick={() => { if (window.confirm('Delete entry?')) deleteEntry(e.id); }} className="px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950 text-sm">Delete</button>
                    </div>
                  </div>
                ))}
                {(!modLoading && modEntries.length === 0) && <div className="text-slate-500 dark:text-slate-400">No items with notes.</div>}
              </div>
            </div>
        )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-900">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}

function User7d({ userId, fetchCount }: { userId: string; fetchCount: (id: string) => Promise<number> }) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => { let mounted = true; fetchCount(userId).then(c => { if (mounted) setCount(c); }); return () => { mounted = false; }; }, [userId]);
  return <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Entries last 7 days: {count ?? '…'}</div>;
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700">
      <span className="text-slate-800 dark:text-slate-200">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
        aria-pressed={checked}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-slate-200 transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}