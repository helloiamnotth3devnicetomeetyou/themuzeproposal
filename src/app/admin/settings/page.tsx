"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SettingsAdmin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState({ name_ko: "", name_en: "", name_ja: "", address_ko: "", address_en: "", address_ja: "", email: "" });
  const [footer, setFooter] = useState({ copyright: "" });
  const [social, setSocial] = useState({ youtube: "", instagram: "", twitter: "", tiktok: "" });

  useEffect(() => { fetchSettings(); }, []);

  async function fetchSettings() {
    setLoading(true);
    const { data } = await supabase.from("site_settings").select("*");
    if (data) {
      data.forEach((item) => {
        if (item.key === "company") setCompany(item.value);
        if (item.key === "footer") setFooter(item.value);
        if (item.key === "social") setSocial(item.value);
      });
    }
    setLoading(false);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const updates = [{ key: "company", value: company }, { key: "footer", value: footer }, { key: "social", value: social }];
    for (const update of updates) { await supabase.from("site_settings").upsert(update as any); }
    setSaving(false); alert("Saved.");
  };

  if (loading) return <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading...</p>;

  const Field = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</label>
      <input value={value || ""} onChange={e => onChange(e.target.value)} className="admin-input" />
    </div>
  );

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Settings</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-8">
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>Company</h2>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Name (KO)" value={company.name_ko} onChange={v => setCompany({ ...company, name_ko: v })} />
              <Field label="Name (EN)" value={company.name_en} onChange={v => setCompany({ ...company, name_en: v })} />
              <Field label="Name (JA)" value={company.name_ja} onChange={v => setCompany({ ...company, name_ja: v })} />
            </div>
            <Field label="Address (KO)" value={company.address_ko} onChange={v => setCompany({ ...company, address_ko: v })} />
            <Field label="Address (EN)" value={company.address_en} onChange={v => setCompany({ ...company, address_en: v })} />
            <Field label="Email" value={company.email} onChange={v => setCompany({ ...company, email: v })} />
          </div>
        </section>

        <hr style={{ borderColor: "var(--border-subtle)" }} />

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>Footer</h2>
          <Field label="Copyright" value={footer.copyright} onChange={v => setFooter({ ...footer, copyright: v })} />
        </section>

        <hr style={{ borderColor: "var(--border-subtle)" }} />

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>Social</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="YouTube" value={social.youtube} onChange={v => setSocial({ ...social, youtube: v })} />
            <Field label="Instagram" value={social.instagram} onChange={v => setSocial({ ...social, instagram: v })} />
            <Field label="Twitter / X" value={social.twitter} onChange={v => setSocial({ ...social, twitter: v })} />
            <Field label="TikTok" value={social.tiktok} onChange={v => setSocial({ ...social, tiktok: v })} />
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="admin-btn admin-btn-primary">{saving ? "Saving..." : "Save Settings"}</button>
        </div>
      </form>
    </div>
  );
}
