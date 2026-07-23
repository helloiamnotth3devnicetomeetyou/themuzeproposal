"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LuFileText, LuPlus } from "react-icons/lu";
import { useAdminConfirm } from "@/components/admin/AdminDialogProvider";
import ContentWorkbench, { type WorkbenchTab } from "@/components/admin/ContentWorkbench";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";
import LoadingIndicator from "@/components/LoadingIndicator";
import { supabase } from "@/lib/supabase";

type Notice = {
  id: string;
  title_ko: string;
  content_ko: string | null;
  category_ko: string;
  date: string;
  is_published: boolean;
};

type NoticeDraft = {
  id: string | null;
  title: string;
  content: string;
  category: string;
  date: string;
  published: boolean;
};

type NoticeTab = "content" | "publish";
type NoticeFilter = "all" | "published" | "draft";

const tabs: WorkbenchTab<NoticeTab>[] = [
  { id: "content", label: "공지 내용" },
  { id: "publish", label: "발행 설정" },
];

const emptyNotice = (): NoticeDraft => ({
  id: null,
  title: "",
  content: "",
  category: "공지",
  date: new Date().toISOString().slice(0, 10),
  published: true,
});

const fromNotice = (notice: Notice): NoticeDraft => ({
  id: notice.id,
  title: notice.title_ko,
  content: notice.content_ko || "",
  category: notice.category_ko,
  date: notice.date,
  published: notice.is_published,
});

export default function NoticeManager({ artistId: scopeArtistId }: { artistId?: string }) {
  const requestConfirm = useAdminConfirm();
  const [artistId, setArtistId] = useState<string | null>(null);
  const [scopeName, setScopeName] = useState(scopeArtistId ? "아티스트" : "THE MUZE");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [draft, setDraft] = useState<NoticeDraft | null>(null);
  const [snapshot, setSnapshot] = useState("");
  const [tab, setTab] = useState<NoticeTab>("content");
  const [filter, setFilter] = useState<NoticeFilter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const serializedDraft = useMemo(() => draft ? JSON.stringify(draft) : "", [draft]);
  const dirty = Boolean(draft && serializedDraft !== snapshot);
  const canSave = Boolean(draft?.title.trim() && draft.content.trim() && draft.category.trim() && draft.date);
  const patchDraft = (patch: Partial<NoticeDraft>) => setDraft((current) => current ? { ...current, ...patch } : current);

  const loadNotices = useCallback(async (preferredId?: string) => {
    setLoading(true);
    setError("");
    let resolvedArtistId: string | null = null;
    if (scopeArtistId) {
      const { data: artist, error: artistError } = await supabase.from("artists").select("id,name").eq("id", scopeArtistId).single();
      if (artistError || !artist) {
        setError("아티스트 정보를 불러오지 못했습니다.");
        setLoading(false);
        return;
      }
      resolvedArtistId = artist.id;
      setScopeName(artist.name || "아티스트");
    } else {
      setScopeName("THE MUZE");
    }
    setArtistId(resolvedArtistId);
    let query = supabase.from("notices").select("id,title_ko,content_ko,category_ko,date,is_published").order("date", { ascending: false });
    query = resolvedArtistId ? query.eq("artist_id", resolvedArtistId) : query.is("artist_id", null);
    const { data, error: noticeError } = await query;
    if (noticeError) {
      setError(noticeError.message);
      setLoading(false);
      return;
    }
    const nextNotices = (data as Notice[] | null) ?? [];
    const selected = nextNotices.find((notice) => notice.id === preferredId) ?? nextNotices[0] ?? null;
    setNotices(nextNotices);
    if (selected) {
      const nextDraft = fromNotice(selected);
      setDraft(nextDraft);
      setSnapshot(JSON.stringify(nextDraft));
    } else {
      setDraft(null);
      setSnapshot("");
    }
    setLoading(false);
  }, [scopeArtistId]);

  useEffect(() => { void Promise.resolve().then(() => loadNotices()); }, [loadNotices]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const visibleNotices = notices.filter((notice) => {
    const matchesSearch = `${notice.title_ko} ${notice.category_ko}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || (filter === "published" ? notice.is_published : !notice.is_published);
    return matchesSearch && matchesFilter;
  });

  const selectNotice = async (notice: Notice) => {
    if (dirty && !await requestConfirm({
      title: "변경사항을 버릴까요?",
      description: "현재 공지에서 저장하지 않은 내용이 사라집니다. 다른 공지를 열기 전에 한 번 더 확인해 주세요.",
      confirmLabel: "버리고 열기",
      tone: "danger",
    })) return;
    const nextDraft = fromNotice(notice);
    setDraft(nextDraft);
    setSnapshot(JSON.stringify(nextDraft));
    setTab("content");
    setError("");
  };

  const addNotice = async () => {
    if (dirty && !await requestConfirm({
      title: "새 공지를 작성할까요?",
      description: "현재 공지에서 저장하지 않은 내용이 사라지고 새 작성 화면으로 이동합니다.",
      confirmLabel: "버리고 새로 작성",
      tone: "danger",
    })) return;
    const nextDraft = emptyNotice();
    setDraft(nextDraft);
    setSnapshot(JSON.stringify(nextDraft));
    setTab("content");
    setError("");
  };

  const saveNotice = async () => {
    if (!draft || !canSave) {
      setError("분류, 제목, 내용, 등록일을 모두 입력하세요.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      artist_id: artistId,
      title_ko: draft.title,
      content_ko: draft.content,
      category_ko: draft.category,
      date: draft.date,
      is_published: draft.published,
      published_at: draft.published ? new Date().toISOString() : null,
    };
    const result = draft.id
      ? await supabase.from("notices").update(payload).eq("id", draft.id).select("id").single()
      : await supabase.from("notices").insert(payload).select("id").single();
    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setToast(draft.id ? "공지를 저장했습니다." : "새 공지를 작성했습니다.");
    await loadNotices(result.data.id);
  };

  const removeNotice = async () => {
    if (!draft?.id) return;
    setDeleting(true);
    const { error: deleteError } = await supabase.from("notices").delete().eq("id", draft.id);
    setDeleting(false);
    if (deleteError) {
      setDeleteOpen(false);
      setError(deleteError.message);
      return;
    }
    setDeleteOpen(false);
    setToast("공지를 삭제했습니다.");
    await loadNotices();
  };

  if (loading) return <LoadingIndicator label="공지 라이브러리를 불러오는 중…" className="min-h-[420px] bg-[var(--bg-card)]" />;

  const rail = <>
    <div className="content-rail-heading"><div><h2>{scopeArtistId ? "아티스트 공지" : "전체 공지"}</h2></div><button type="button" onClick={() => void addNotice()} aria-label="공지 작성"><LuPlus aria-hidden="true" /></button></div>
    <div className="content-rail-tools"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="공지 검색" aria-label="공지 검색" /><div className="content-filter-row">{(["all", "published", "draft"] as NoticeFilter[]).map((item) => <button key={item} type="button" className={filter === item ? "is-active" : ""} onClick={() => setFilter(item)}>{item === "all" ? "전체" : item === "published" ? "공개" : "비공개"}</button>)}</div></div>
    <div className="content-rail-sort"><span>{visibleNotices.length}개 공지</span><small>{scopeName}</small></div>
    <div className="content-library-list notice-library-list">
      {draft && !draft.id && <button type="button" className="content-library-item notice-library-item is-selected"><span className="notice-library-date"><b>NEW</b><small>{draft.date.slice(5).replace("-", ".")}</small></span><span className="content-library-copy"><b>{draft.title || "새 공지"}</b><small>{draft.category} · {draft.published ? "공개 예정" : "비공개"}</small></span></button>}
      {visibleNotices.map((notice) => <button key={notice.id} type="button" onClick={() => void selectNotice(notice)} className={`content-library-item notice-library-item ${draft?.id === notice.id ? "is-selected" : ""}`}><span className="notice-library-date"><b>{notice.date.slice(0, 4)}</b><small>{notice.date.slice(5).replace("-", ".")}</small></span><span className="content-library-copy"><b>{notice.title_ko}</b><small>{notice.category_ko} · {notice.is_published ? "공개" : "비공개"}</small></span><span className={`content-library-dot ${notice.is_published ? "is-live" : ""}`} /></button>)}
      {!visibleNotices.length && !draft?.id && <div className="content-library-empty"><b>표시할 공지가 없습니다.</b><span>검색 조건을 바꾸거나 새 공지를 작성하세요.</span></div>}
    </div>
  </>;

  const identity = draft ? <>
    <span className="notice-identity-date"><b>{draft.date ? draft.date.slice(5, 7) : "—"}</b><small>{draft.date ? draft.date.slice(8, 10) : "—"}</small></span>
    <div className="content-identity-copy"><p><span className={`cms-status ${draft.published ? "is-live" : ""}`}>{draft.published ? "공개" : "비공개"}</span>{dirty && <em>저장하지 않은 변경사항</em>}</p><h2>{draft.title || "제목 없는 공지"}</h2><small>{scopeName} · {draft.category || "분류 미설정"}</small></div>
  </> : <div className="content-identity-copy"><p><span className="cms-status">선택 안 됨</span></p><h2>공지를 선택하세요</h2><small>{scopeName} notice desk</small></div>;

  const actions = draft ? <>{draft.id && <button type="button" className="content-delete-action" onClick={() => setDeleteOpen(true)}>삭제</button>}<button type="button" className="admin-btn admin-btn-primary" disabled={!dirty || !canSave || saving} onClick={() => void saveNotice()}>{saving ? "저장 중…" : "변경사항 저장"}</button></> : <button type="button" className="admin-btn admin-btn-primary" onClick={() => void addNotice()}>공지 작성</button>;

  return <><ContentWorkbench rail={rail} identity={identity} actions={actions} tabs={tabs} activeTab={tab} onTabChange={setTab} error={error} onDismissError={() => setError("")} toast={toast} className="notice-workbench">
    {!draft ? <div className="content-no-selection"><span><LuFileText aria-hidden="true" /></span><h2>공지를 선택하세요</h2><p>왼쪽 라이브러리에서 공지를 열거나 새 소식을 작성할 수 있습니다.</p><button type="button" className="admin-btn admin-btn-primary" onClick={() => void addNotice()}>공지 작성</button></div> : <div className="content-editor-stack">
      {tab === "content" && <>
        <div className="content-section-heading"><h3>공지 내용</h3><span>독자가 목록에서 찾고 본문에서 읽게 될 제목과 내용을 작성합니다.</span></div>
        <div className="music-field-grid two"><label className="music-field"><span>분류 <b>*</b></span><input className="admin-input" value={draft.category} onChange={(event) => patchDraft({ category: event.target.value })} /></label><label className="music-field"><span>등록일 <b>*</b></span><input type="date" className="admin-input" value={draft.date} onChange={(event) => patchDraft({ date: event.target.value })} /></label></div>
        <label className="music-field"><span>제목 <b>*</b></span><input className="admin-input content-title-input" value={draft.title} onChange={(event) => patchDraft({ title: event.target.value })} autoFocus /></label>
        <label className="music-field"><span>내용 <b>*</b></span><textarea className="admin-input content-notice-textarea" value={draft.content} onChange={(event) => patchDraft({ content: event.target.value })} /></label>
      </>}
      {tab === "publish" && <>
        <div className="content-section-heading"><h3>발행 설정</h3><span>공지의 노출 범위와 공개 상태를 마지막으로 확인합니다.</span></div>
        <div className="notice-preview-card"><p>{draft.category || "분류"}</p><h3>{draft.title || "공지 제목"}</h3><small>{draft.date || "등록일 미설정"} · {scopeArtistId ? `${scopeName} 아티스트` : "전체 공지"}</small><span>{draft.content || "공지 내용을 입력하면 여기에 미리 표시됩니다."}</span></div>
        <div className="content-choice-grid"><label className="content-choice"><input type="radio" checked={draft.published} onChange={() => patchDraft({ published: true })} /><span><b>공개</b><small>저장 즉시 사이트 공지 목록에 표시합니다.</small></span></label><label className="content-choice"><input type="radio" checked={!draft.published} onChange={() => patchDraft({ published: false })} /><span><b>비공개</b><small>관리자에만 저장하고 사이트에는 표시하지 않습니다.</small></span></label></div>
      </>}
    </div>}
  </ContentWorkbench>{deleteOpen && draft?.id && <DeleteConfirmDialog title="공지를 삭제할까요?" description="공지가 관리자와 공개 목록에서 영구적으로 제거됩니다. 이 작업은 되돌릴 수 없습니다." confirmValue={draft.title} valueLabel="공지 제목" busy={deleting} onCancel={() => setDeleteOpen(false)} onConfirm={() => void removeNotice()} />}</>;
}
