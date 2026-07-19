"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuditionsAdmin() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<any | null>(null);

  useEffect(() => { fetchSubmissions(); }, []);

  async function fetchSubmissions() {
    setLoading(true);
    const { data } = await supabase.from("audition_submissions").select("*").order("created_at", { ascending: false });
    if (data) setSubmissions(data);
    setLoading(false);
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("audition_submissions").update({ status }).eq("id", id);
    if (viewing?.id === id) setViewing({ ...viewing, status });
    fetchSubmissions();
  };

  if (loading) return <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading...</p>;

  if (viewing) {
    return (
      <div className="max-w-3xl flex flex-col gap-6">
        <button onClick={() => setViewing(null)} className="text-xs font-medium self-start" style={{ color: "var(--text-muted)" }}>← Back</button>

        <div className="admin-card">
          <div className="flex justify-between items-start mb-6 pb-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{viewing.name}</h2>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{viewing.email} · {viewing.contact}</p>
            </div>
            <span className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>{viewing.status}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {[["Category", viewing.category], ["Birth", viewing.birth], ["Gender", viewing.gender], ["Submitted", new Date(viewing.created_at).toLocaleDateString()]].map(([label, val]) => (
              <div key={label as string}>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>{label}</p>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-primary)" }}>{val || "—"}</p>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-faint)" }}>Introduction</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{viewing.intro || "—"}</p>
          </div>

          {viewing.link && (
            <div className="mb-6">
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-faint)" }}>Media Link</p>
              <a href={viewing.link} target="_blank" className="text-sm break-all" style={{ color: "var(--text-primary)" }}>{viewing.link}</a>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {["pending", "reviewing", "accepted", "rejected"].map(s => (
            <button key={s} onClick={() => updateStatus(viewing.id, s)} className={`admin-btn text-xs ${viewing.status === s ? "admin-btn-primary" : "admin-btn-secondary"}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Audition Submissions</h1>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead><tr><th>Date</th><th>Applicant</th><th>Category</th><th>Status</th><th className="text-right">-</th></tr></thead>
          <tbody>
            {submissions.map(s => (
              <tr key={s.id} className="cursor-pointer" onClick={() => setViewing(s)}>
                <td style={{ color: "var(--text-muted)" }}>{new Date(s.created_at).toLocaleDateString()}</td>
                <td>
                  <p className="font-medium" style={{ color: "var(--text-primary)" }}>{s.name}</p>
                  <p className="text-xs" style={{ color: "var(--text-faint)" }}>{s.email}</p>
                </td>
                <td style={{ color: "var(--text-secondary)" }}>{s.category}</td>
                <td><span className="text-xs font-medium uppercase" style={{ color: "var(--text-muted)" }}>{s.status}</span></td>
                <td className="text-right"><span className="text-xs" style={{ color: "var(--text-muted)" }}>View →</span></td>
              </tr>
            ))}
            {submissions.length === 0 && <tr><td colSpan={5} className="text-center py-8" style={{ color: "var(--text-muted)" }}>No submissions.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
