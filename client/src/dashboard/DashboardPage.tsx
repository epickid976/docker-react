import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../auth/AuthContext";

type Student = { id: string; display_name: string };
type Lesson = { id: string; title: string; status: "draft" | "published" };

export default function DashboardPage() {
  const { user, tenantId } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      setLoading(true);
      const [{ data: s }, { data: l }] = await Promise.all([
        supabase.from("student").select("id, display_name").eq("tenant_id", tenantId),
        supabase.from("lesson").select("id, title, status").eq("tenant_id", tenantId),
      ]);
      setStudents(s || []);
      setLessons(l || []);
      setLoading(false);
    })();
  }, [tenantId]);

  return (
    <div style={{ padding: 24 }}>
      <h1>Teacher/Admin Dashboard</h1>
      <p style={{ opacity: 0.7 }}>Signed in as {user?.email}</p>

      {loading && <p>Loading…</p>}

      {!loading && (
        <>
          <section style={{ marginTop: 24 }}>
            <h2>Students</h2>
            {students.length === 0 ? (
              <p>No students yet.</p>
            ) : (
              <ul>
                {students.map((s) => (
                  <li key={s.id}>{s.display_name}</li>
                ))}
              </ul>
            )}
          </section>

          <section style={{ marginTop: 24 }}>
            <h2>Lessons</h2>
            {lessons.length === 0 ? (
              <p>No lessons yet.</p>
            ) : (
              <ul>
                {lessons.map((l) => (
                  <li key={l.id}>
                    {l.title} <em style={{ opacity: 0.6 }}>({l.status})</em>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={{ marginTop: 24 }}>
            <h2>Quick Actions</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => alert("TODO: Create Student modal")}>+ Student</button>
              <button onClick={() => alert("TODO: Create Lesson flow")}>+ Lesson (draft)</button>
              <button onClick={() => alert("TODO: Assign Next Lesson UI")}>Assign Next Lesson</button>
              <button onClick={() => alert("TODO: Generate Code")}>Generate Device Code</button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}