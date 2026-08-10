"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Check, CircleAlert, Disc3, GripVertical, Music, Plus, Trash2 } from "lucide-react";
import { useAdminConfirm } from "@/admin/components/shell/AdminDialogProvider";
import DeleteConfirmDialog from "@/admin/components/shell/DeleteConfirmDialog";
import { CoverAssetField, HeroAssetField, TrackAssetField } from "@/admin/components/assets/MusicAssetFields";
import AdminAssetImage from "@/admin/components/assets/AdminAssetImage";
import GalleryManager from "@/admin/components/assets/GalleryManager";
import PreviewButton from "@/admin/components/content/PreviewButton";
import FormField from "@/admin/components/content/FormField";
import DraftSaveButton from "@/admin/components/content/DraftSaveButton";
import ContentWorkbench, { type WorkbenchTab } from "@/admin/components/content/ContentWorkbench";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import CustomSelect from "@/core/components/form/CustomSelect";
import {
  ALBUM_TYPES,
  type AlbumEditorDraft,
  type EditorTab,
  managedAssetFromUrl,
  parseBulkTracks,
  type TrackDraft,
  type UploadedAsset,
  validateAlbum,
} from "@/core/utils/music-editor";
import { useAdminEntityEditor } from "@/admin/hooks/useAdminEntityEditor";
import { usePageDrafts } from "@/admin/hooks/usePageDrafts";
import { useAdminPreview } from "@/admin/hooks/useAdminPreview";
import { supabase } from "@/core/supabase/client";
import { spotifyAlbumId } from "@/core/http/spotify";
import { adminDbError } from "@/admin/utils/admin-db-error";
import {
  albumSelect,
  albumToDraft,
  collectAssetUrls,
  createAlbumDraft,
  createTrackDraft,
  legacyAlbumSelect,
  type RawAlbum,
} from "./discography-editor-model";

type Filter = "all" | "published" | "draft";
type Language = "ko" | "en" | "ja";

function AssetBadge({ active, children }: { active: boolean; children: React.ReactNode }) {
  return <span className={`music-asset-badge ${active ? "is-ready" : ""}`}>{children}</span>;
}

export default function DiscographyAdmin() {
  const routeArtistId = useParams<{ id: string }>()?.id;
  const requestConfirm = useAdminConfirm();
  const [artistId, setArtistId] = useState("");
  const [artistName, setArtistName] = useState("");
  const [artistSlug, setArtistSlug] = useState("");
  const [albums, setAlbums] = useState<AlbumEditorDraft[]>([]);
  const [tab, setTab] = useState<EditorTab>("basic");
  const [language, setLanguage] = useState<Language>("ko");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkValue, setBulkValue] = useState("");
  const [sorting, setSorting] = useState(false);
  const [sortDirty, setSortDirty] = useState(false);
  const [dragAlbum, setDragAlbum] = useState<string | null>(null);
  const [dragTrack, setDragTrack] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState(false);
  const uploadedAssets = useRef<UploadedAsset[]>([]);

  const {
    draft,
    setDraft,
    snapshot = "",
    setSnapshot,
    dirty,
    loading,
    setLoading,
    saving,
    setSaving,
    deleting,
    setDeleting,
    deleteOpen,
    setDeleteOpen,
    error,
    setError,
    toast,
    setToast,
    patchDraft,
    recovery = null,
    restoreDraft = () => {},
    discardDraftBackup = () => {},
  } = useAdminEntityEditor<AlbumEditorDraft>({ initialDraft: null, storageKey: `admin-draft:discography:${routeArtistId}` });

  const validation = useMemo(() => draft ? validateAlbum(draft) : null, [draft]);
  const nestedDrafts = usePageDrafts();

  const previewPayload = useMemo(() => draft && artistId && artistSlug ? {
    artist: { id: artistId, slug: artistSlug, name: artistName },
    album: draft,
  } : null, [artistId, artistName, artistSlug, draft]);
  const { openPreview } = useAdminPreview({
    kind: "album",
    payload: previewPayload,
    targetPath: previewPayload ? `/${artistSlug}/discography?album=${encodeURIComponent(previewPayload.album.id)}` : "",
    canPreview: Boolean(previewPayload),
    unavailableMessage: "?? ????? ??? ???? ?? ??? ?????.",
    onError: setError,
  });

  const syncUrl = useCallback((albumId: string, nextTab: EditorTab) => {
    const params = new URLSearchParams(window.location.search);
    params.set("album", albumId); params.set("tab", nextTab);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, []);

  const loadAlbums = useCallback(async (preferredId?: string) => {
    setLoading(true); setError("");
    const { data: artist, error: artistError } = await supabase.from("artists").select("id,name,slug").eq("id", routeArtistId).maybeSingle();
    if (artistError || !artist) { setError("아티스트 정보를 불러오지 못했습니다."); setLoading(false); return; }
    const albumResult = await supabase.from("albums").select(albumSelect).eq("artist_id", artist.id).order("sort_order", { ascending: true }).overrideTypes<RawAlbum[], { merge: false }>();
    let albumRows = albumResult.data;
    let albumError = albumResult.error;
    if (albumError?.message.includes("typo_logo_url") || albumError?.message.includes("title_ko")) {
      const legacyResult = await supabase.from("albums").select(legacyAlbumSelect).eq("artist_id", artist.id).order("sort_order", { ascending: true });
      albumRows = legacyResult.data ? legacyResult.data.map((album) => ({
        ...album,
        typo_logo_url: null,
        title_ko: album.title,
        title_en: null,
        title_ja: null,
        tracks: (album.tracks ?? []).map((track) => ({
          ...track,
          title_ko: track.title,
          title_en: null,
          title_ja: null,
        })),
      })) as RawAlbum[] : null;
      albumError = legacyResult.error;
    }
    if (albumError) { setError(albumError.message.includes("spotify_url") ? "음악 편집 DB 마이그레이션(003_music_editor.sql)을 먼저 적용해 주세요." : albumError.message); setLoading(false); return; }
    const nextAlbums = (albumRows ?? []).map(albumToDraft);
    setArtistId(artist.id); setArtistName(artist.name || ""); setArtistSlug(artist.slug || ""); setAlbums(nextAlbums);
    const params = new URLSearchParams(window.location.search);
    const requestedId = preferredId || params.get("album") || nextAlbums[0]?.id;
    const selected = nextAlbums.find((album) => album.id === requestedId) ?? nextAlbums[0] ?? null;
    const requestedTab = params.get("tab");
    const nextTab: EditorTab = requestedTab === "content" || requestedTab === "tracks" || requestedTab === "gallery" || requestedTab === "publish" ? requestedTab : "basic";
    setDraft(selected); setSnapshot(selected ? JSON.stringify(selected) : ""); setTab(nextTab);
    if (selected) syncUrl(selected.id, nextTab);
    setLoading(false);
  }, [routeArtistId, setDraft, setError, setLoading, setSnapshot, syncUrl]);

  useEffect(() => { void Promise.resolve().then(() => loadAlbums()); }, [loadAlbums]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const patchTrack = (id: string, patch: Partial<TrackDraft>) => setDraft((current) => current ? { ...current, tracks: current.tracks.map((track) => track.id === id ? { ...track, ...patch } : track) } : current);

  const removeAssets = async (assets: UploadedAsset[]) => {
    const groups = new Map<string, string[]>();
    assets.forEach((asset) => groups.set(asset.bucket, [...(groups.get(asset.bucket) ?? []), asset.path]));
    await Promise.all([...groups].map(([bucket, paths]) => supabase.storage.from(bucket).remove(paths)));
  };

  const discardQueuedUploads = async () => {
    const queued = [...uploadedAssets.current]; uploadedAssets.current = [];
    if (queued.length) await removeAssets(queued);
  };

  const selectAlbum = async (album: AlbumEditorDraft) => {
    if ((dirty || pendingDelete) && !await requestConfirm({
      title: "변경사항을 버릴까요?",
      description: "현재 앨범에서 저장하지 않은 정보와 업로드 대기 파일이 사라집니다. 다른 앨범을 열기 전에 한 번 더 확인해 주세요.",
      confirmLabel: "버리고 열기",
      tone: "danger",
    })) return;
    await discardQueuedUploads(); setPendingDelete(false); setDraft(album); setSnapshot(JSON.stringify(album)); setTab("basic"); setError(""); setExpandedTrack(null); syncUrl(album.id, "basic");
  };

  const addAlbum = async () => {
    if (!artistId) return;
    if ((dirty || pendingDelete) && !await requestConfirm({
      title: "새 앨범을 만들까요?",
      description: "현재 앨범에서 저장하지 않은 정보와 업로드 대기 파일이 사라지고 새 앨범 작성 화면으로 이동합니다.",
      confirmLabel: "버리고 새로 만들기",
      tone: "danger",
    })) return;
    await discardQueuedUploads();
    const next = createAlbumDraft(artistId, albums.length + 1); setPendingDelete(false); setDraft(next); setSnapshot(JSON.stringify(next)); setTab("basic"); setExpandedTrack(null); syncUrl(next.id, "basic");
  };

  const changeTab = (next: EditorTab) => { if (!draft) return; setTab(next); syncUrl(draft.id, next); };
  const handleTitle = (title: string) => patchDraft({
    title,
    title_ko: draft?.title_ko || title,
  });

  const registerUpload = (asset: UploadedAsset) => { uploadedAssets.current.push(asset); };

  const save = async () => {
    if (!draft || !validation?.canSave) { setError(`저장 전 확인: ${validation?.saveIssues.join(", ") || "필수 정보를 확인해 주세요."}`); return; }
    if (draft.is_published && !validation.canPublish) { setError(`공개 전 확인: ${validation.publishIssues.join(", ")}`); setTab("publish"); return; }
    setSaving(true); setError("");
    const original = albums.find((album) => album.id === draft.id);
    const { tracks, ...albumDraft } = draft;
    const albumPayload = {
      ...albumDraft,
      title_ko: draft.title_ko.trim() || draft.title,
      title_en: draft.title_en.trim() || null,
      title_ja: draft.title_ja.trim() || null,
      slug: draft.id,
    };
    const localizedTracks = tracks.map((track) => ({
      ...track,
      title_ko: track.title_ko.trim() || track.title,
      title_en: track.title_en.trim() || null,
      title_ja: track.title_ja.trim() || null,
    }));
    const { data, error: saveError } = await supabase.rpc("save_album_with_tracks", { p_album: albumPayload, p_tracks: localizedTracks });
    if (saveError) { setSaving(false); setError(adminDbError(saveError, "앨범을 저장하지 못했습니다.")); return; }

    const savedAlbumId = String(data ?? draft.id);
    const [{ error: localizedAlbumError }, ...localizedTrackResults] = await Promise.all([
      supabase.from("albums").update({
        hero_image_url: draft.hero_image_url || null,
        typo_logo_url: draft.typo_logo_url || null,
        title_ko: draft.title_ko.trim() || draft.title,
        title_en: draft.title_en.trim() || null,
        title_ja: draft.title_ja.trim() || null,
      }).eq("id", savedAlbumId),
      ...localizedTracks.map((track) => supabase.from("tracks").update({
        title_ko: track.title_ko,
        title_en: track.title_en,
        title_ja: track.title_ja,
      }).eq("id", track.id)),
    ]);
    const localizedTrackError = localizedTrackResults.find((result) => result.error)?.error;
    if (localizedAlbumError || localizedTrackError) {
      const assetError = localizedAlbumError || localizedTrackError;
      setSaving(false);
      setError(assetError!.message.includes("title_ko") ? "다국어 콘텐츠 DB 마이그레이션을 먼저 적용해 주세요." : assetError!.message);
      return;
    }

    const referenced = collectAssetUrls(draft);
    const stale = original ? [...collectAssetUrls(original)].filter((url) => !referenced.has(url)).map(managedAssetFromUrl).filter(Boolean) : [];
    await Promise.all(stale.map((asset) => supabase.storage.from(asset!.bucket).remove([asset!.path])));
    uploadedAssets.current = [];
    setSaving(false); setToast("변경사항을 저장했습니다."); discardDraftBackup(); await loadAlbums(savedAlbumId);
  };

  const removeAlbum = async () => {
    if (!draft || !albums.some((album) => album.id === draft.id)) return;
    setDeleting(true);
    const assets = [...collectAssetUrls(draft)].map(managedAssetFromUrl).filter(Boolean);
    const { error: deleteError } = await supabase.from("albums").delete().eq("id", draft.id);
    if (deleteError) { setDeleting(false); setDeleteOpen(false); setError(deleteError.message); return; }
    await Promise.all(assets.map((asset) => supabase.storage.from(asset!.bucket).remove([asset!.path])));
    setDeleting(false); setDeleteOpen(false);
    setToast("앨범을 삭제했습니다."); await loadAlbums();
  };

  const reorderAlbum = (targetId: string) => {
    if (!dragAlbum || dragAlbum === targetId) return;
    setAlbums((current) => { const next = [...current]; const from = next.findIndex((album) => album.id === dragAlbum); const to = next.findIndex((album) => album.id === targetId); const [moved] = next.splice(from, 1); next.splice(to, 0, moved); return next; });
    setSortDirty(true); setDragAlbum(null);
  };

  const saveOrder = async () => {
    const { error: orderError } = await supabase.rpc("reorder_albums", { p_artist_id: artistId, p_album_ids: albums.map((album) => album.id) });
    if (orderError) return setError(orderError.message);
    setSortDirty(false); setSorting(false); setToast("앨범 순서를 저장했습니다."); await loadAlbums(draft?.id);
  };

  const reorderTrack = (targetId: string) => {
    if (!draft || !dragTrack || dragTrack === targetId) return;
    const next = [...draft.tracks]; const from = next.findIndex((track) => track.id === dragTrack); const to = next.findIndex((track) => track.id === targetId); const [moved] = next.splice(from, 1); next.splice(to, 0, moved); patchDraft({ tracks: next }); setDragTrack(null);
  };

  const applyBulk = () => {
    if (!draft) return;
    const parsed = parseBulkTracks(bulkValue);
    if (!parsed.length) return setError("붙여넣은 트랙을 찾지 못했습니다.");
    patchDraft({ tracks: [...draft.tracks, ...parsed] }); setBulkOpen(false); setBulkValue(""); setTab("tracks");
  };

  const visibleAlbums = albums.filter((album) => {
    const matchesSearch = `${album.title} ${album.type}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (filter === "all" || (filter === "published" ? album.is_published : !album.is_published));
  });

  if (loading) return <AdminSkeleton variant="workbench" className="min-h-[420px]" />;

  const workbenchTabs: WorkbenchTab<EditorTab>[] = [
    { id: "basic", label: "기본 정보", complete: Boolean(draft?.title && draft.release_date && draft.cover_url), missing: [draft?.title, draft?.release_date, draft?.cover_url].filter((value) => !value).length },
    { id: "content", label: "콘텐츠", complete: Boolean(draft?.description_ko), missing: draft?.description_ko ? 0 : 1 },
    { id: "tracks", label: `트랙 ${draft?.tracks.length || 0}`, complete: Boolean(draft?.tracks.length), missing: draft?.tracks.length ? 0 : 1 },
    { id: "gallery", label: "갤러리", complete: Boolean(draft && albums.some((album) => album.id === draft.id)) },
    { id: "publish", label: "공개 설정", complete: Boolean(validation?.canPublish), missing: validation?.publishIssues.length || 0 },
  ];
  const rail = <>
      <div className="music-library-heading" data-tour-id="entity-create"><div><h2>앨범 라이브러리</h2></div><button type="button" onClick={() => void addAlbum()} aria-label="새 앨범"><Plus aria-hidden="true" /></button></div>
      <div className="music-library-tools">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="앨범 검색" aria-label="앨범 검색" />
        <div className="music-filter-row">{(["all", "published", "draft"] as Filter[]).map((item) => <button key={item} type="button" className={filter === item ? "is-active" : ""} onClick={() => setFilter(item)}>{item === "all" ? "전체" : item === "published" ? "공개" : "초안"}</button>)}</div>
      </div>
      <div className="music-sort-row" data-tour-id="album-sort"><span>{visibleAlbums.length}개 앨범</span><button type="button" onClick={() => { setSorting((value) => !value); setSortDirty(false); }}>{sorting ? "정렬 취소" : "순서 변경"}</button></div>
      <div className="music-album-list">
        {visibleAlbums.map((album) => <button key={album.id} type="button" data-tour-id="entity-list-item" draggable={sorting} onDragStart={() => setDragAlbum(album.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => reorderAlbum(album.id)} onClick={() => !sorting && void selectAlbum(album)} className={`music-album-item ${draft?.id === album.id ? "is-selected" : ""} ${sorting ? "is-sorting" : ""}`}>
          <span className="music-album-grip">{sorting ? <GripVertical aria-hidden="true" /> : String(albums.indexOf(album) + 1).padStart(2, "0")}</span>
          <span className="music-album-cover">{album.cover_url ? <AdminAssetImage src={album.cover_url} alt="" sizes="56px" /> : <i />}</span>
          <span className="music-album-copy"><b>{album.title}</b><small>{album.type} · {album.tracks.length}곡</small></span>
          <span className={`cms-status ${album.is_published ? "is-live" : ""}`}>{album.is_published ? "공개" : "초안"}</span>
        </button>)}
        {!visibleAlbums.length && <div className="music-empty"><b>표시할 앨범이 없습니다.</b><span>검색 조건을 바꾸거나 새 앨범을 추가해 보세요.</span></div>}
      </div>
      {sorting && sortDirty && <div className="music-order-footer">변경한 순서는 상단 저장 버튼으로 반영됩니다.</div>}
    </>;
  const identity = draft ? <>
            <span className="music-header-cover">{draft.cover_url ? <AdminAssetImage src={draft.cover_url} alt="" sizes="72px" /> : <i />}</span>
            <div><p><span className={`cms-status ${draft.is_published ? "is-live" : ""}`}>{draft.is_published ? "공개" : "초안"}</span>{dirty && <em>저장하지 않은 변경사항</em>}</p><h2>{draft.title || "제목 없는 새 앨범"}</h2><small>{artistName}</small></div>
  </> : <div className="content-identity-copy"><p><span className="cms-status">선택 안 됨</span></p><h2>앨범을 선택하세요</h2><small>{artistName}</small></div>;
  const actions = draft ? <div className="music-header-actions">{albums.some((album) => album.id === draft.id) && <button type="button" data-tour-id="entity-delete" className="admin-btn admin-btn-danger music-delete-button" onClick={() => pendingDelete ? setPendingDelete(false) : setDeleteOpen(true)}><Trash2 aria-hidden="true" />{pendingDelete ? "삭제 취소" : "삭제"}</button>}<PreviewButton onClick={openPreview} disabled={!previewPayload} /><DraftSaveButton snapshot={snapshot} draft={draft} dirty={dirty || sortDirty || nestedDrafts.dirty || pendingDelete} saving={saving} disabled={!pendingDelete && !validation?.canSave && dirty} extraDiff={[...(pendingDelete ? [{ kind: "delete" as const, field: "앨범", before: draft.title, after: "삭제" }] : []), ...(sortDirty ? [{ kind: "order" as const, field: "앨범 노출 순서", before: "기존 순서", after: "변경된 순서" }] : []), ...nestedDrafts.diff]} onSave={async () => { if (pendingDelete) return removeAlbum(); if (dirty) await save(); if (sortDirty) await saveOrder(); await nestedDrafts.commit(); }} /></div> : <button type="button" className="admin-btn admin-btn-primary" onClick={() => void addAlbum()}>새 앨범 만들기</button>;

  return <>
    <ContentWorkbench rail={rail} identity={identity} actions={actions} tabs={workbenchTabs} activeTab={tab} onTabChange={changeTab} error={error} onDismissError={() => setError("")} toast={toast} className="music-editor-shell" recovery={recovery ? { updatedAt: recovery.updatedAt, onRestore: restoreDraft, onDiscard: discardDraftBackup } : null}>
      {!draft ? <div className="music-no-selection"><span><Disc3 aria-hidden="true" /></span><h2>앨범을 선택하세요</h2><p>왼쪽 라이브러리에서 앨범을 열거나 새 앨범을 추가할 수 있습니다.</p><button type="button" className="admin-btn admin-btn-primary" onClick={() => void addAlbum()}>새 앨범 만들기</button></div> :
        <div className="music-editor-body">
          {tab === "basic" && <div className="music-section-stack music-basic-section">
            <div className="content-section-heading"><h3>앨범 기본 정보</h3><span>공개 페이지에 표시되는 정보와 앨범 고유 ID를 설정합니다.</span></div>
            <div className="music-field-grid two"><label className="music-field"><span>앨범 제목 <b>*</b></span><input className="admin-input" value={draft.title} onChange={(event) => handleTitle(event.target.value)} autoFocus /></label><div className="music-field"><span>앨범 종류 <b>*</b></span><CustomSelect ariaLabel="앨범 종류" value={draft.type} onChange={(type) => patchDraft({ type })} options={ALBUM_TYPES.map((type) => ({ value: type, label: type }))} /></div></div>
            <FormField label="표시 제목" valueKo={draft.title_ko} valueEn={draft.title_en} valueJa={draft.title_ja} onChangeKo={(value) => patchDraft({ title_ko: value })} onChangeEn={(value) => patchDraft({ title_en: value })} onChangeJa={(value) => patchDraft({ title_ja: value })} />
            <label className="music-field music-date-field"><span>발매일</span><input type="date" className="admin-input" value={draft.release_date} onChange={(event) => patchDraft({ release_date: event.target.value })} /></label>
            <div className="music-divider" />
            <CoverAssetField artistId={artistId} albumId={draft.id} value={draft.cover_url} onError={setError} onUploaded={(asset, color) => { registerUpload(asset); patchDraft({ cover_url: asset.url, color }); }} />
            <HeroAssetField artistId={artistId} albumId={draft.id} value={draft.hero_image_url} onError={setError} onUploaded={(asset) => { registerUpload(asset); patchDraft({ hero_image_url: asset.url }); }} onClear={() => patchDraft({ hero_image_url: "" })} />
            <TrackAssetField label="앨범 타이포 로고" hint="SVG 파일을 끌어놓거나 선택하세요 · 테마 색상 자동 적용 · 최대 10MB" accept="image/svg+xml,.svg" maxBytes={10 * 1024 * 1024} artistId={artistId} albumId={draft.id} trackId="album" kind="logo" secureSvg value={draft.typo_logo_url} onError={setError} onClear={() => patchDraft({ typo_logo_url: "" })} onUploaded={(asset) => { registerUpload(asset); patchDraft({ typo_logo_url: asset.url }); }} />
            <label className="music-field music-color-field"><span>테마 컬러</span><div><input type="color" value={draft.color} onChange={(event) => patchDraft({ color: event.target.value.toUpperCase() })} /><input className="admin-input" value={draft.color} onChange={(event) => patchDraft({ color: event.target.value.toUpperCase() })} /></div><small>커버 업로드 시 자동으로 추천되며 직접 조정할 수 있습니다.</small></label>
          </div>}

          {tab === "content" && <div className="music-section-stack">
            <div className="content-section-heading"><h3>앨범 소개와 외부 링크</h3><span>언어별 소개를 작성하고 앨범 단위 스트리밍 링크를 연결합니다.</span></div>
            <div className="music-language-tabs">{(["ko", "en", "ja"] as Language[]).map((item) => <button type="button" key={item} className={language === item ? "is-active" : ""} onClick={() => setLanguage(item)}>{item.toUpperCase()}<i className={draft[`description_${item}`].trim() ? "is-complete" : ""} /></button>)}</div>
            <label className="music-field"><span>{language === "ko" ? "한국어" : language === "en" ? "영어" : "일본어"} 앨범 소개</span><textarea className="admin-input" rows={9} value={draft[`description_${language}`]} onChange={(event) => patchDraft({ [`description_${language}`]: event.target.value } as Partial<AlbumEditorDraft>)} placeholder="앨범의 콘셉트와 이야기를 입력하세요." /></label>
            <div className="music-field-grid two"><label className="music-field"><span>Spotify 앨범 ID 또는 URL</span><input className="admin-input" value={draft.spotify_id} onChange={(event) => patchDraft({ spotify_id: event.target.value })} onBlur={() => patchDraft({ spotify_id: spotifyAlbumId(draft.spotify_id) || "" })} placeholder="Spotify 앨범 ID 또는 URL" /></label><label className="music-field"><span>YouTube Music URL</span><input type="url" className="admin-input" value={draft.youtube_url} onChange={(event) => patchDraft({ youtube_url: event.target.value })} placeholder="https://music.youtube.com/…" /></label></div>
          </div>}

          {tab === "tracks" && <div className="music-section-stack music-track-section">
            <div className="music-section-title" data-tour-id="track-add"><div><h3>수록곡과 미디어</h3><span>곡명, MP3, Spotify, YouTube 음원을 한곳에서 관리합니다.</span></div><div><button type="button" data-tour-id="track-bulk" className="admin-btn admin-btn-secondary" onClick={() => setBulkOpen(true)}>여러 곡 붙여넣기</button><button type="button" className="admin-btn admin-btn-primary" onClick={() => { const track = createTrackDraft(); patchDraft({ tracks: [...draft.tracks, track] }); setExpandedTrack(track.id); }}>+ 트랙 추가</button></div></div>
            <div className="music-track-table">
              <div className="music-track-head"><span>순서</span><span>곡 정보</span><span>미디어 상태</span><span /></div>
              {draft.tracks.map((track, index) => <div key={track.id} className={`music-track-wrap ${expandedTrack === track.id ? "is-open" : ""}`} draggable onDragStart={() => setDragTrack(track.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => reorderTrack(track.id)}>
                <div className="music-track-row">
                  <button type="button" className="music-track-grip" aria-label={`${track.title || "트랙"} 순서 변경`}><GripVertical aria-hidden="true" /><i>{String(index + 1).padStart(2, "0")}</i></button>
                  <div className="music-track-title"><input value={track.title} onChange={(event) => patchTrack(track.id, { title: event.target.value })} placeholder="곡명" /><label><input type="checkbox" checked={track.is_title} onChange={(event) => patchTrack(track.id, { is_title: event.target.checked })} /> 타이틀곡</label></div>
                  <div className="music-track-badges"><AssetBadge active={Boolean(track.audio_url)}>MP3</AssetBadge><AssetBadge active={Boolean(track.spotify_url)}>Spotify</AssetBadge><AssetBadge active={Boolean(track.youtube_url)}>YouTube</AssetBadge></div>
                  <div className="music-track-actions" data-tour-id="track-actions"><button type="button" data-tour-id="track-media" onClick={() => setExpandedTrack(expandedTrack === track.id ? null : track.id)}>{expandedTrack === track.id ? "접기" : "미디어"}</button><button type="button" data-tour-id="track-delete" className="is-danger" onClick={() => patchDraft({ tracks: draft.tracks.filter((item) => item.id !== track.id) })}>삭제</button></div>
                </div>
                {expandedTrack === track.id && <div className="music-track-assets">
                  <div className="music-track-link-grid">
                    <FormField label="곡명" valueKo={track.title_ko} valueEn={track.title_en} valueJa={track.title_ja} onChangeKo={(value) => patchTrack(track.id, { title_ko: value })} onChangeEn={(value) => patchTrack(track.id, { title_en: value })} onChangeJa={(value) => patchTrack(track.id, { title_ja: value })} />
                  </div>
                  <div className="music-track-link-grid"><label className="music-field"><span>곡별 Spotify 링크</span><input type="url" className="admin-input" value={track.spotify_url} onChange={(event) => patchTrack(track.id, { spotify_url: event.target.value })} placeholder="https://open.spotify.com/track/…" /></label><label className="music-field"><span>곡별 YouTube 링크</span><input type="url" className="admin-input" value={track.youtube_url} onChange={(event) => patchTrack(track.id, { youtube_url: event.target.value })} placeholder="https://youtube.com/watch?v=…" /></label></div>
                  <div className="music-track-asset-grid is-single">
                    <TrackAssetField label="음원 MP3" hint="파일을 끌어놓거나 선택하세요 · 최대 100MB" accept="audio/mpeg,audio/mp3,.mp3" maxBytes={100 * 1024 * 1024} artistId={artistId} albumId={draft.id} trackId={track.id} kind="audio" value={track.audio_url} onError={setError} onClear={() => patchTrack(track.id, { audio_url: "" })} onUploaded={(asset) => { registerUpload(asset); patchTrack(track.id, { audio_url: asset.url }); }} />
                  </div>
                  {track.audio_url && <audio className="music-audio-preview" controls preload="metadata" src={track.audio_url}>브라우저가 오디오 재생을 지원하지 않습니다.</audio>}
                </div>}
              </div>)}
              {!draft.tracks.length && <div className="music-track-empty"><span><Music aria-hidden="true" /></span><b>아직 수록곡이 없습니다.</b><p>한 곡씩 추가하거나 트랙리스트를 한 번에 붙여넣으세요.</p></div>}
            </div>
          </div>}

          {tab === "gallery" && <div className="music-section-stack music-gallery-section">
            <div className="content-section-heading"><h3>앨범 갤러리</h3><span>이 앨범의 이미지를 모으고, 이미지에 등장하는 멤버를 함께 지정합니다.</span></div>
            <GalleryManager artistId={artistId || null} scope="album" albumId={albums.some((album) => album.id === draft.id) ? draft.id : null} onError={setError} onToast={setToast} />
          </div>}

          {tab === "publish" && <div className="music-section-stack">
            <div className="content-section-heading"><h3>공개 설정</h3><span>공개 전 필수 정보를 확인하고,<br />연결된 미디어를 마지막으로 점검합니다.</span></div>
            <div className="music-publish-summary"><div className="music-publish-cover">{draft.cover_url ? <AdminAssetImage src={draft.cover_url} alt="" sizes="120px" /> : <span>커버 없음</span>}</div><div><p>{draft.type}</p><h4>{draft.title || "제목 없음"}</h4><span>{draft.release_date || "발매일 미설정"} · {draft.tracks.length}곡</span><div className="music-summary-badges"><AssetBadge active={draft.tracks.some((track) => Boolean(track.audio_url))}>MP3 {draft.tracks.filter((track) => track.audio_url).length}</AssetBadge><AssetBadge active={draft.tracks.some((track) => Boolean(track.youtube_url))}>YouTube {draft.tracks.filter((track) => track.youtube_url).length}</AssetBadge><AssetBadge active={Boolean(draft.typo_logo_url)}>Typo</AssetBadge></div></div></div>
            <div className={`music-publish-check ${validation?.canPublish ? "is-ready" : ""}`}><span>{validation?.canPublish ? <Check aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}</span><div><b>{validation?.canPublish ? "공개할 준비가 되었습니다." : "공개 전 확인이 필요합니다."}</b><p>{validation?.canPublish ? "필수 정보가 모두 입력되었습니다." : validation?.publishIssues.join(" · ")}</p></div></div>
            <label className="music-publish-toggle"><span><b>웹사이트에 공개</b><small>공개하면 디스코그래피에서 앨범과 업로드한 음원을 볼 수 있습니다.</small></span><input type="checkbox" checked={draft.is_published} onChange={(event) => { if (event.target.checked && !validation?.canPublish) { setError(`공개 전 확인: ${validation?.publishIssues.join(", ")}`); return; } patchDraft({ is_published: event.target.checked }); }} /></label>
          </div>}
        </div>}
    </ContentWorkbench>

    {bulkOpen && <div className="music-crop-modal" role="dialog" aria-modal="true" aria-label="여러 트랙 붙여넣기"><div className="music-bulk-card"><h3>여러 곡 붙여넣기</h3><p>한 줄에 한 곡씩 입력하세요. 앞의 트랙 번호는 자동으로 제거합니다.</p><pre>01. Lucky You{"\n"}02. Glow Up</pre><textarea className="admin-input" rows={10} value={bulkValue} onChange={(event) => setBulkValue(event.target.value)} autoFocus placeholder="한 줄에 한 곡씩 입력" /><div><button type="button" className="admin-btn admin-btn-secondary" onClick={() => setBulkOpen(false)}>취소</button><button type="button" className="admin-btn admin-btn-primary" onClick={applyBulk}>트랙 추가</button></div></div></div>}
    {deleteOpen && draft && <DeleteConfirmDialog title="앨범을 삭제할까요?" description="삭제 작업은 상단 저장 전까지 서버에 반영되지 않습니다." confirmValue={draft.title} valueLabel="앨범명" busy={deleting} onCancel={() => setDeleteOpen(false)} onConfirm={() => { setPendingDelete(true); setDeleteOpen(false); }} />}
  </>;
}
