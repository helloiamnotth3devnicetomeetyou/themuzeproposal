"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import FormField from "@/components/admin/FormField";
import Image from "next/image";

export default function HeroAdmin() {
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const [imageUrl, setImageUrl] = useState("");
  const [spotifyId, setSpotifyId] = useState("");
  const [titleKo, setTitleKo] = useState(""); const [titleEn, setTitleEn] = useState(""); const [titleJa, setTitleJa] = useState("");
  const [subtitleKo, setSubtitleKo] = useState(""); const [subtitleEn, setSubtitleEn] = useState(""); const [subtitleJa, setSubtitleJa] = useState("");
  const [descKo, setDescKo] = useState(""); const [descEn, setDescEn] = useState(""); const [descJa, setDescJa] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchSlides(); }, []);

  async function fetchSlides() {
    setLoading(true);
    const { data } = await supabase.from("hero_slides").select("*").order("sort_order", { ascending: true });
    if (data) setSlides(data);
    setLoading(false);
  }

  const handleEdit = (s: any) => {
    setCurrentId(s.id); setImageUrl(s.image_url || ""); setSpotifyId(s.spotify_id || "");
    setTitleKo(s.title_ko || ""); setTitleEn(s.title_en || ""); setTitleJa(s.title_ja || "");
    setSubtitleKo(s.subtitle_ko || ""); setSubtitleEn(s.subtitle_en || ""); setSubtitleJa(s.subtitle_ja || "");
    setDescKo(s.desc_ko || ""); setDescEn(s.desc_en || ""); setDescJa(s.desc_ja || "");
    setIsActive(s.is_active); setIsEditing(true);
  };

  const handleAddNew = () => {
    setCurrentId(null); setImageUrl(""); setSpotifyId("");
    setTitleKo(""); setTitleEn(""); setTitleJa("");
    setSubtitleKo(""); setSubtitleEn(""); setSubtitleJa("");
    setDescKo(""); setDescEn(""); setDescJa("");
    setIsActive(true); setIsEditing(true);
  };

  const handleCancel = () => { setIsEditing(false); setCurrentId(null); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const payload = {
      image_url: imageUrl, spotify_id: spotifyId,
      title_ko: titleKo, title_en: titleEn, title_ja: titleJa,
      subtitle_ko: subtitleKo, subtitle_en: subtitleEn, subtitle_ja: subtitleJa,
      desc_ko: descKo, desc_en: descEn, desc_ja: descJa,
      is_active: isActive,
    };
    if (currentId) await supabase.from("hero_slides").update(payload).eq("id", currentId);
    else await supabase.from("hero_slides").insert([{ ...payload, sort_order: slides.length + 1 }]);
    setSaving(false); setIsEditing(false); fetchSlides();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this slide?")) { await supabase.from("hero_slides").delete().eq("id", id); fetchSlides(); }
  };

  if (loading) return <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading...</p>;

  if (isEditing) {
    return (
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{currentId ? "Edit Slide" : "New Slide"}</h2>
          <button onClick={handleCancel} className="text-sm" style={{ color: "var(--text-muted)" }}>Cancel</button>
        </div>
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Image URL</label>
              <input required value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="admin-input" placeholder="/images/hero_1.png" />
              {imageUrl && (
                <div className="mt-2 relative w-full h-28 rounded overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
                  <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Spotify Album ID</label>
              <input value={spotifyId} onChange={e => setSpotifyId(e.target.value)} className="admin-input" />
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <FormField label="Title" valueKo={titleKo} valueEn={titleEn} valueJa={titleJa} onChangeKo={setTitleKo} onChangeEn={setTitleEn} onChangeJa={setTitleJa} required />
            <FormField label="Subtitle" valueKo={subtitleKo} valueEn={subtitleEn} valueJa={subtitleJa} onChangeKo={setSubtitleKo} onChangeEn={setSubtitleEn} onChangeJa={setSubtitleJa} />
            <FormField label="Description" type="textarea" valueKo={descKo} valueEn={descEn} valueJa={descJa} onChangeKo={setDescKo} onChangeEn={setDescEn} onChangeJa={setDescJa} />
          </div>

          <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} /> Active
          </label>

          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={handleCancel} className="admin-btn admin-btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="admin-btn admin-btn-primary">{saving ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Hero Slides</h1>
        <button onClick={handleAddNew} className="admin-btn admin-btn-primary">Add Slide</button>
      </div>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead><tr><th>#</th><th>Image</th><th>Title</th><th>Active</th><th className="text-right">Actions</th></tr></thead>
          <tbody>
            {slides.map((s, idx) => (
              <tr key={s.id}>
                <td style={{ color: "var(--text-muted)" }}>{idx + 1}</td>
                <td>
                  <div className="w-16 h-10 rounded overflow-hidden relative" style={{ border: "1px solid var(--border-subtle)" }}>
                    <Image src={s.image_url} alt={s.title_ko} fill className="object-cover" />
                  </div>
                </td>
                <td className="font-medium">{s.title_ko}</td>
                <td><span className="text-xs" style={{ color: s.is_active ? "var(--text-secondary)" : "var(--text-faint)" }}>{s.is_active ? "Yes" : "No"}</span></td>
                <td className="text-right whitespace-nowrap">
                  <button onClick={() => handleEdit(s)} className="text-xs mr-3" style={{ color: "var(--text-muted)" }}>Edit</button>
                  <button onClick={() => handleDelete(s.id)} className="text-xs" style={{ color: "var(--text-faint)" }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
