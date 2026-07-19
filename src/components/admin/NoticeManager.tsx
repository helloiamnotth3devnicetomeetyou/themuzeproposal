"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Notice = {
  id: string;
  title_ko: string;
  content_ko: string;
  category_ko: string;
  date: string;
  is_published: boolean;
};

export default function NoticeManager({ artistSlug }: { artistSlug?: string }) {
  const [artistId, setArtistId] = useState<string | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Notice | null | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("공지");
  const [date, setDate] = useState("");
  const [published, setPublished] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scopeLabel = artistSlug ? `${artistSlug.toUpperCase()} 아티스트 공지` : "전체 공지";

  async function resolveArtist() {
    if (!artistSlug) return null;
    const { data } = await supabase.from("artists").select("id").eq("slug", artistSlug).single();
    return data?.id ?? null;
  }

  async function loadNotices() {
    setLoading(true);
    const id = await resolveArtist();
    if (artistSlug && !id) { setArtistId(null); setNotices([]); setLoading(false); return; }
    setArtistId(id);
    let query = supabase.from("notices").select("id,title_ko,content_ko,category_ko,date,is_published").order("date", { ascending: false });
    query = id ? query.eq("artist_id", id) : query.is("artist_id", null);
    const { data } = await query;
    setNotices((data ?? []) as Notice[]);
    setLoading(false);
  }

  useEffect(() => { void loadNotices(); }, [artistSlug]);

  function openNew() {
    setEditing(null); setTitle(""); setContent(""); setCategory("공지"); setDate(new Date().toISOString().slice(0, 10)); setPublished(true); setError(null);
  }
  function openEdit(notice: Notice) {
    setEditing(notice); setTitle(notice.title_ko); setContent(notice.content_ko ?? ""); setCategory(notice.category_ko); setDate(notice.date); setPublished(notice.is_published); setError(null);
  }
  function closeEditor() { setEditing(undefined); setError(null); }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const payload = {
      artist_id: artistId,
      title_ko: title,
      content_ko: content,
      category_ko: category,
      date,
      is_published: published,
      published_at: published ? new Date().toISOString() : null,
    };
    const result = editing ? await supabase.from("notices").update(payload).eq("id", editing.id) : await supabase.from("notices").insert(payload);
    if (result.error) { setError(result.error.message); return; }
    closeEditor();
    void loadNotices();
  }

  async function remove(id: string) {
    if (!confirm("이 공지를 삭제할까요?")) return;
    const { error: deleteError } = await supabase.from("notices").delete().eq("id", id);
    if (deleteError) { setError(deleteError.message); return; }
    void loadNotices();
  }

  if (loading) return <p className="text-sm" style={{ color: "var(--text-muted)" }}>불러오는 중...</p>;

  if (editing !== undefined) {
    return <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-bold">{editing ? "공지 수정" : "새 공지"}</h2><button onClick={closeEditor} className="text-sm" style={{ color: "var(--text-muted)" }}>취소</button></div>
      <form onSubmit={save} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>분류<input required value={category} onChange={(e) => setCategory(e.target.value)} className="admin-input" /></label>
          <label className="flex flex-col gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>등록일<input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="admin-input" /></label>
        </div>
        <label className="flex flex-col gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>제목<input required value={title} onChange={(e) => setTitle(e.target.value)} className="admin-input" /></label>
        <label className="flex flex-col gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>내용<textarea required value={content} onChange={(e) => setContent(e.target.value)} className="admin-input" /></label>
        <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> 공개하기</label>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex justify-end gap-2"><button type="button" onClick={closeEditor} className="admin-btn admin-btn-secondary">취소</button><button className="admin-btn admin-btn-primary">저장</button></div>
      </form>
    </div>;
  }

  return <div className="flex flex-col gap-6">
    <div className="flex items-center justify-between"><h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{scopeLabel}</h2><button onClick={openNew} className="admin-btn admin-btn-primary">공지 작성</button></div>
    {error && <p className="text-xs text-red-500">{error}</p>}
    <div className="admin-table-container"><table className="admin-table"><thead><tr><th>등록일</th><th>분류</th><th>제목</th><th>상태</th><th className="text-right">관리</th></tr></thead><tbody>
      {notices.map((notice) => <tr key={notice.id}><td>{notice.date}</td><td>{notice.category_ko}</td><td className="font-medium max-w-md truncate">{notice.title_ko}</td><td>{notice.is_published ? "공개" : "비공개"}</td><td className="text-right whitespace-nowrap"><button onClick={() => openEdit(notice)} className="text-xs mr-3">수정</button><button onClick={() => void remove(notice.id)} className="text-xs" style={{ color: "var(--text-muted)" }}>삭제</button></td></tr>)}
      {!notices.length && <tr><td colSpan={5} className="text-center py-10" style={{ color: "var(--text-muted)" }}>등록된 공지가 없습니다.</td></tr>}
    </tbody></table></div>
  </div>;
}
