import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../auth/AuthContext";

type Tenant = {
  id: string;
  name: string;
  status: "pending" | "approved" | "rejected";
  type: "institution" | "independent";
  created_at: string;
};

export default function AdminPage() {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase
      .from("tenant")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) setErr(error.message);
    setTenants(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    const { error } = await supabase
      .from("tenant")
      .update({ status: "approved" })
      .eq("id", id);
    if (error) return alert(error.message);
    load();
  }

  async function reject(id: string) {
    const { error } = await supabase
      .from("tenant")
      .update({ status: "rejected" })
      .eq("id", id);
    if (error) return alert(error.message);
    load();
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>System Admin</h1>
      <p style={{ opacity: 0.7 }}>Signed in as {user?.email}</p>

      <h2 style={{ marginTop: 24 }}>Pending Institutions</h2>

      {loading && <p>Loading…</p>}
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      {!loading && tenants.length === 0 && <p>Nothing pending 🎉</p>}

      <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
        {tenants.map((t) => (
          <li
            key={t.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
              display: "flex",
              gap: 12,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{t.name}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                type: {t.type} • created: {new Date(t.created_at).toLocaleString()}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => approve(t.id)}>Approve</button>
              <button onClick={() => reject(t.id)}>Reject</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}