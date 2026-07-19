"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { CoverAssetField, TrackAssetField } from "@/components/admin/MusicAssetFields";
import {
  ALBUM_TYPES,
  type AlbumEditorDraft,
  type EditorTab,
  formatDuration,
  managedAssetFromUrl,
  parseBulkTracks,
  parseDuration,
  type TrackDraft,
  toSlug,
  type UploadedAsset,
  validateAlbum,
} from "@/lib/music-editor";
import { supabase } from "@/lib/supabase";

type RawTrack = {
  id: string; title: string; duration: number | null; is_title: boolean; track_number: number;
  spotify_url: string | null; audio_url: string | null; music_video_url: string | null; logo_url: string | null;
};

type RawAlbum = {
  id: string; artist_id: string; slug: string; title: string; type: string; release_date: string | null;
  cover_url: string | null; color: string; spotify_id: string | null; youtube_url: string | null;
  description_ko: string | null; description_en: string | null; description_ja: string | null;
  is_published: boolean; published_at: string | null; sort_order: number; tracks: RawTrack[] | null;
};

type Filter = "all" | "published" | "draft";
type Language = "ko" | "en" | "ja";

const albumSelect = "id,artist_id,slug,title,type,release_date,cover_url,color,spotify_id,youtube_url,description_ko,description_en,description_ja,is_published,published_at,sort_order,tracks(id,title,duration,is_title,track_number,spotify_url,audio_url,music_video_url,logo_url)";

function fromRaw(album: RawAlbum): AlbumEditorDraft {
  return {
    id: album.id, artist_id: album.artist_id, slug: album.slug, title: album.title, type: album.type,
    release_date: album.release_date ?? "", cover_url: album.cover_url ?? "", color: album.color || "#FC6FCF",
    spotify_id: album.spotify_id ?? "", youtube_url: album.youtube_url ?? "",
    description_ko: album.description_ko ?? "", description_en: album.description_en ?? "", description_ja: album.description_ja ?? "",
    is_published: album.is_published, published_at: album.published_at, sort_order: album.sort_order,
    tracks: [...(album.tracks ?? [])].sort((a, b) => a.track_number - b.track_number).map((track) => ({
      id: track.id, title: track.title, duration: track.duration, is_title: track.is_title,
      spotify_url: track.spotify_url ?? "", audio_url: track.audio_url ?? "",
      music_video_url: track.music_video_url ?? "", logo_url: track.logo_url ?? "",
    })),
  };
}

function newAlbum(artistId: string, sortOrder: number): AlbumEditorDraft {
  return {
    id: crypto.randomUUID(), artist_id: artistId, slug: "", title: "", type: "Mini Album", release_date: "",
    cover_url: "", color: "#FC6FCF", spotify_id: "", youtube_url: "", description_ko: "", description_en: "",
    description_ja: "", is_published: false, published_at: null, sort_order: sortOrder, tracks: [],
  };
}

function newTrack(): TrackDraft {
  return { id: crypto.randomUUID(), title: "", duration: null, is_title: false, spotify_url: "", audio_url: "", music_video_url: "", logo_url: "" };
}

function collectAssetUrls(draft: AlbumEditorDraft) {
  return new Set([draft.cover_url, ...draft.tracks.flatMap((track) => [track.audio_url, track.music_video_url, track.logo_url])].filter(Boolean));
}

function AssetBadge({ active, children }: { active: boolean; children: React.ReactNode }) {
  return <span className={`music-asset-badge ${active ? "is-ready" : ""}`}>{children}</span>;
}

export default function DiscographyAdmin() {
  const routeSlug = useParams<{ slug: string }>()?.slug;
  const [artistId, setArtistId] = useState("");
  const [artistName, setArtistName] = useState("");
  const [albums, setAlbums] = useState<AlbumEditorDraft[]>([]);
  const [draft, setDraft] = useState<AlbumEditorDraft | null>(null);
  const [snapshot, setSnapshot] = useState("");
  const [tab, setTab] = useState<EditorTab>("basic");
  const [language, setLanguage] = useState<Language>("ko");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkValue, setBulkValue] = useState("");
  const [sorting, setSorting] = useState(false);
  const [sortDirty, setSortDirty] = useState(false);
  const [dragAlbum, setDragAlbum] = useState<string | null>(null);
  const [dragTrack, setDragTrack] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const uploadedAssets = useRef<UploadedAsset[]>([]);

  const dirty = Boolean(draft && JSON.stringify(draft) !== snapshot);
  const validation = useMemo(() => draft ? validateAlbum(draft) : null, [draft]);

  const syncUrl = useCallback((albumId: string, nextTab: EditorTab) => {
    const params = new URLSearchParams(window.location.search);
    params.set("album", albumId); params.set("tab", nextTab);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, []);

  const loadAlbums = useCallback(async (preferredId?: string) => {
    setLoading(true); setError("");
    const { data: artist, error: artistError } = await supabase.from("artists").select("id,name").eq("slug", routeSlug).maybeSingle();
    if (artistError || !artist) { setError("아티스트 정보를 불러오지 못했습니다."); setLoading(false); return; }
    const { data, error: albumError } = await supabase.from("albums").select(albumSelect).eq("artist_id", artist.id).order("sort_order", { ascending: true });
    if (albumError) { setError(albumError.message.includes("spotify_url") ? "음악 편집 DB 마이그레이션(003_music_editor.sql)을 먼저 적용해 주세요." : albumError.message); setLoading(false); return; }
    const nextAlbums = ((data ?? []) as unknown as RawAlbum[]).map(fromRaw);
    setArtistId(artist.id); setArtistName(artist.name ?? routeSlug); setAlbums(nextAlbums);
    const params = new URLSearchParams(window.location.search);
    const requestedId = preferredId || params.get("album") || nextAlbums[0]?.id;
    const selected = nextAlbums.find((album) => album.id === requestedId) ?? nextAlbums[0] ?? null;
    const requestedTab = params.get("tab");
    const nextTab: EditorTab = requestedTab === "content" || requestedTab === "tracks" || requestedTab === "publish" ? requestedTab : "basic";
    setDraft(selected); setSnapshot(selected ? JSON.stringify(selected) : ""); setTab(nextTab); setSlugTouched(Boolean(selected));
    if (selected) syncUrl(selected.id, nextTab);
    setLoading(false);
  }, [routeSlug, syncUrl]);

  useEffect(() => { void Promise.resolve().then(() => loadAlbums()); }, [loadAlbums]);
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

  const patchDraft = (patch: Partial<AlbumEditorDraft>) => setDraft((current) => current ? { ...current, ...patch } : current);
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
    if (dirty && !confirm("저장하지 않은 변경사항이 있습니다. 변경사항을 버리고 다른 앨범을 열까요?")) return;
    await discardQueuedUploads(); setDraft(album); setSnapshot(JSON.stringify(album)); setTab("basic"); setSlugTouched(true); setError(""); setExpandedTrack(null); syncUrl(album.id, "basic");
  };

  const addAlbum = async () => {
    if (!artistId) return;
    if (dirty && !confirm("저장하지 않은 변경사항을 버리고 새 앨범을 만들까요?")) return;
    await discardQueuedUploads();
    const next = newAlbum(artistId, albums.length + 1); setDraft(next); setSnapshot(JSON.stringify(next)); setTab("basic"); setSlugTouched(false); setExpandedTrack(null); syncUrl(next.id, "basic");
  };

  const changeTab = (next: EditorTab) => { if (!draft) return; setTab(next); syncUrl(draft.id, next); };
  const handleTitle = (title: string) => patchDraft({ title, ...(!slugTouched ? { slug: toSlug(title) } : {}) });

  const registerUpload = (asset: UploadedAsset) => { uploadedAssets.current.push(asset); };

  const save = async () => {
    if (!draft || !validation?.canSave) { setError(`저장 전 확인: ${validation?.saveIssues.join(", ") || "필수 정보를 확인해 주세요."}`); return; }
    if (draft.is_published && !validation.canPublish) { setError(`공개 전 확인: ${validation.publishIssues.join(", ")}`); setTab("publish"); return; }
    setSaving(true); setError("");
    const original = albums.find((album) => album.id === draft.id);
    const { tracks, ...albumPayload } = draft;
    const { data, error: saveError } = await supabase.rpc("save_album_with_tracks", { p_album: albumPayload, p_tracks: tracks });
    if (saveError) { setSaving(false); setError(saveError.code === "23505" ? "같은 URL ID를 사용하는 앨범이 있습니다." : saveError.message); return; }

    const referenced = collectAssetUrls(draft);
    const stale = original ? [...collectAssetUrls(original)].filter((url) => !referenced.has(url)).map(managedAssetFromUrl).filter(Boolean) : [];
    await Promise.all(stale.map((asset) => supabase.storage.from(asset!.bucket).remove([asset!.path])));
    uploadedAssets.current = [];
    setSaving(false); setToast("변경사항을 저장했습니다."); await loadAlbums(String(data ?? draft.id));
  };

  const removeAlbum = async () => {
    if (!draft || !albums.some((album) => album.id === draft.id)) return;
    if (!confirm(`‘${draft.title}’ 앨범을 삭제할까요? 수록곡 ${draft.tracks.length}곡과 연결된 파일도 함께 정리됩니다.`)) return;
    const assets = [...collectAssetUrls(draft)].map(managedAssetFromUrl).filter(Boolean);
    const { error: deleteError } = await supabase.from("albums").delete().eq("id", draft.id);
    if (deleteError) { setError(deleteError.message); return; }
    await Promise.all(assets.map((asset) => supabase.storage.from(asset!.bucket).remove([asset!.path])));
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

  if (loading) return <div className="music-editor-loading"><span />앨범 라이브러리를 불러오는 중…</div>;

  return <div className="music-editor-shell">
    {toast && <div className="music-toast" role="status">✓ {toast}</div>}
    <aside className="music-library">
      <div className="music-library-heading"><div><p className="music-kicker">{artistName}</p><h2>앨범 라이브러리</h2></div><button type="button" onClick={() => void addAlbum()} aria-label="새 앨범">+</button></div>
      <div className="music-library-tools">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="앨범 검색" aria-label="앨범 검색" />
        <div className="music-filter-row">{(["all", "published", "draft"] as Filter[]).map((item) => <button key={item} type="button" className={filter === item ? "is-active" : ""} onClick={() => setFilter(item)}>{item === "all" ? "전체" : item === "published" ? "공개" : "초안"}</button>)}</div>
      </div>
      <div className="music-sort-row"><span>{visibleAlbums.length}개 앨범</span><button type="button" onClick={() => { setSorting((value) => !value); setSortDirty(false); }}>{sorting ? "정렬 취소" : "순서 변경"}</button></div>
      <div className="music-album-list">
        {visibleAlbums.map((album) => <button key={album.id} type="button" draggable={sorting} onDragStart={() => setDragAlbum(album.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => reorderAlbum(album.id)} onClick={() => !sorting && void selectAlbum(album)} className={`music-album-item ${draft?.id === album.id ? "is-selected" : ""} ${sorting ? "is-sorting" : ""}`}>
          <span className="music-album-grip">{sorting ? "⠿" : String(albums.indexOf(album) + 1).padStart(2, "0")}</span>
          <span className="music-album-cover">{album.cover_url ? <img src={album.cover_url} alt="" /> : <i />}</span>
          <span className="music-album-copy"><b>{album.title}</b><small>{album.type} · {album.tracks.length}곡</small></span>
          <span className={`cms-status ${album.is_published ? "is-live" : ""}`}>{album.is_published ? "공개" : "초안"}</span>
        </button>)}
        {!visibleAlbums.length && <div className="music-empty"><b>표시할 앨범이 없습니다.</b><span>검색 조건을 바꾸거나 새 앨범을 추가해 보세요.</span></div>}
      </div>
      {sorting && <div className="music-order-footer"><button type="button" className="admin-btn admin-btn-primary" disabled={!sortDirty} onClick={() => void saveOrder()}>순서 저장</button></div>}
    </aside>

    <section className="music-workbench">
      {error && <div className="music-error" role="alert"><span>!</span><p>{error}</p><button type="button" onClick={() => setError("")}>닫기</button></div>}
      {!draft ? <div className="music-no-selection"><span>◇</span><h2>앨범을 선택하세요</h2><p>왼쪽 라이브러리에서 앨범을 열거나 새 앨범을 추가할 수 있습니다.</p><button type="button" className="admin-btn admin-btn-primary" onClick={() => void addAlbum()}>새 앨범 만들기</button></div> : <>
        <header className="music-editor-header">
          <div className="music-editor-identity">
            <span className="music-header-cover">{draft.cover_url ? <img src={draft.cover_url} alt="" /> : <i />}</span>
            <div><p><span className={`cms-status ${draft.is_published ? "is-live" : ""}`}>{draft.is_published ? "공개" : "초안"}</span>{dirty && <em>저장하지 않은 변경사항</em>}</p><h2>{draft.title || "제목 없는 새 앨범"}</h2><small>/{routeSlug}/discography/{draft.slug || "album-id"}</small></div>
          </div>
          <div className="music-header-actions">{albums.some((album) => album.id === draft.id) && <button type="button" className="music-delete-button" onClick={() => void removeAlbum()}>삭제</button>}<button type="button" className="admin-btn admin-btn-primary" disabled={!dirty || saving || !validation?.canSave} onClick={() => void save()}>{saving ? "저장 중…" : "변경사항 저장"}</button></div>
        </header>

        <nav className="music-editor-tabs" aria-label="앨범 편집 탭">
          {([{ id: "basic", label: "기본 정보" }, { id: "content", label: "콘텐츠" }, { id: "tracks", label: `트랙 ${draft.tracks.length}` }, { id: "publish", label: "공개 설정" }] as { id: EditorTab; label: string }[]).map((item) => <button key={item.id} type="button" className={tab === item.id ? "is-active" : ""} onClick={() => changeTab(item.id)}>{item.label}</button>)}
        </nav>

        <div className="music-editor-body">
          {tab === "basic" && <div className="music-section-stack">
            <div className="music-section-title music-release-heading"><div><p className="music-kicker">RELEASE DATA</p><h3>앨범 기본 정보</h3><span>공개 페이지에 표시되는 정보와<br />앨범 URL의 기준을 설정합니다.</span></div></div>
            <div className="music-field-grid two"><label className="music-field"><span>앨범 제목 <b>*</b></span><input className="admin-input" value={draft.title} onChange={(event) => handleTitle(event.target.value)} autoFocus /></label><label className="music-field"><span>앨범 종류 <b>*</b></span><select className="admin-input" value={draft.type} onChange={(event) => patchDraft({ type: event.target.value })}>{ALBUM_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label></div>
            <div className="music-field-grid two"><label className="music-field"><span>URL ID <b>*</b></span><input className="admin-input" value={draft.slug} onChange={(event) => { setSlugTouched(true); patchDraft({ slug: toSlug(event.target.value) }); }} /><small>영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.</small></label><label className="music-field"><span>발매일</span><input type="date" className="admin-input" value={draft.release_date} onChange={(event) => patchDraft({ release_date: event.target.value })} /></label></div>
            <div className="music-divider" />
            <CoverAssetField artistId={artistId} albumId={draft.id} value={draft.cover_url} onError={setError} onUploaded={(asset, color) => { registerUpload(asset); patchDraft({ cover_url: asset.url, color }); }} />
            <label className="music-field music-color-field"><span>테마 컬러</span><div><input type="color" value={draft.color} onChange={(event) => patchDraft({ color: event.target.value.toUpperCase() })} /><input className="admin-input" value={draft.color} onChange={(event) => patchDraft({ color: event.target.value.toUpperCase() })} /></div><small>커버 업로드 시 자동으로 추천되며 직접 조정할 수 있습니다.</small></label>
          </div>}

          {tab === "content" && <div className="music-section-stack">
            <div className="music-section-title"><div><p className="music-kicker">STORY & LINKS</p><h3>앨범 소개와 외부 링크</h3><span>언어별 소개를 작성하고 앨범 단위 스트리밍 링크를 연결합니다.</span></div></div>
            <div className="music-language-tabs">{(["ko", "en", "ja"] as Language[]).map((item) => <button type="button" key={item} className={language === item ? "is-active" : ""} onClick={() => setLanguage(item)}>{item.toUpperCase()}<i className={draft[`description_${item}`].trim() ? "is-complete" : ""} /></button>)}</div>
            <label className="music-field"><span>{language === "ko" ? "한국어" : language === "en" ? "영어" : "일본어"} 앨범 소개</span><textarea className="admin-input" rows={9} value={draft[`description_${language}`]} onChange={(event) => patchDraft({ [`description_${language}`]: event.target.value } as Partial<AlbumEditorDraft>)} placeholder="앨범의 콘셉트와 이야기를 입력하세요." /></label>
            <div className="music-field-grid two"><label className="music-field"><span>Spotify 앨범 ID</span><input className="admin-input" value={draft.spotify_id} onChange={(event) => patchDraft({ spotify_id: event.target.value })} placeholder="Spotify 앨범 ID" /></label><label className="music-field"><span>YouTube Music URL</span><input type="url" className="admin-input" value={draft.youtube_url} onChange={(event) => patchDraft({ youtube_url: event.target.value })} placeholder="https://music.youtube.com/…" /></label></div>
          </div>}

          {tab === "tracks" && <div className="music-section-stack music-track-section">
            <div className="music-section-title"><div><p className="music-kicker">TRACK ASSETS</p><h3>수록곡과 미디어</h3><span>곡명, 재생 시간, MP3, Spotify, 뮤직비디오, 곡 로고를 한곳에서 관리합니다.</span></div><div><button type="button" className="admin-btn admin-btn-secondary" onClick={() => setBulkOpen(true)}>여러 곡 붙여넣기</button><button type="button" className="admin-btn admin-btn-primary" onClick={() => { const track = newTrack(); patchDraft({ tracks: [...draft.tracks, track] }); setExpandedTrack(track.id); }}>+ 트랙 추가</button></div></div>
            <div className="music-track-table">
              <div className="music-track-head"><span>순서</span><span>곡 정보</span><span>미디어 상태</span><span>재생 시간</span><span /></div>
              {draft.tracks.map((track, index) => <div key={track.id} className={`music-track-wrap ${expandedTrack === track.id ? "is-open" : ""}`} draggable onDragStart={() => setDragTrack(track.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => reorderTrack(track.id)}>
                <div className="music-track-row">
                  <button type="button" className="music-track-grip" aria-label={`${track.title || "트랙"} 순서 변경`}>⠿ <i>{String(index + 1).padStart(2, "0")}</i></button>
                  <div className="music-track-title"><input value={track.title} onChange={(event) => patchTrack(track.id, { title: event.target.value })} placeholder="곡명" /><label><input type="checkbox" checked={track.is_title} onChange={(event) => patchTrack(track.id, { is_title: event.target.checked })} /> 타이틀곡</label></div>
                  <div className="music-track-badges"><AssetBadge active={Boolean(track.audio_url)}>MP3</AssetBadge><AssetBadge active={Boolean(track.spotify_url)}>Spotify</AssetBadge><AssetBadge active={Boolean(track.music_video_url)}>MV</AssetBadge><AssetBadge active={Boolean(track.logo_url)}>Logo</AssetBadge></div>
                  <input className="music-duration-input" value={formatDuration(track.duration)} onChange={(event) => patchTrack(track.id, { duration: parseDuration(event.target.value) })} placeholder="0:00" aria-label={`${track.title || "트랙"} 재생 시간`} />
                  <div className="music-track-actions"><button type="button" onClick={() => setExpandedTrack(expandedTrack === track.id ? null : track.id)}>{expandedTrack === track.id ? "접기" : "미디어"}</button><button type="button" className="is-danger" onClick={() => patchDraft({ tracks: draft.tracks.filter((item) => item.id !== track.id) })}>삭제</button></div>
                </div>
                {expandedTrack === track.id && <div className="music-track-assets">
                  <label className="music-field music-spotify-field"><span>곡별 Spotify 링크</span><input type="url" className="admin-input" value={track.spotify_url} onChange={(event) => patchTrack(track.id, { spotify_url: event.target.value })} placeholder="https://open.spotify.com/track/…" /></label>
                  <div className="music-track-asset-grid">
                    <TrackAssetField label="음원 MP3" hint="최대 100MB" accept="audio/mpeg" maxBytes={100 * 1024 * 1024} artistId={artistId} albumId={draft.id} trackId={track.id} kind="audio" value={track.audio_url} onError={setError} onClear={() => patchTrack(track.id, { audio_url: "" })} onUploaded={(asset) => { registerUpload(asset); patchTrack(track.id, { audio_url: asset.url }); }} />
                    <TrackAssetField label="뮤직비디오 MP4" hint="최대 500MB" accept="video/mp4" maxBytes={500 * 1024 * 1024} artistId={artistId} albumId={draft.id} trackId={track.id} kind="video" value={track.music_video_url} onError={setError} onClear={() => patchTrack(track.id, { music_video_url: "" })} onUploaded={(asset) => { registerUpload(asset); patchTrack(track.id, { music_video_url: asset.url }); }} />
                    <TrackAssetField label="곡 로고" hint="PNG/WebP · 최대 10MB" accept="image/png,image/webp,image/jpeg" maxBytes={10 * 1024 * 1024} artistId={artistId} albumId={draft.id} trackId={track.id} kind="logo" value={track.logo_url} onError={setError} onClear={() => patchTrack(track.id, { logo_url: "" })} onUploaded={(asset) => { registerUpload(asset); patchTrack(track.id, { logo_url: asset.url }); }} />
                  </div>
                  {track.audio_url && <audio className="music-audio-preview" controls preload="metadata" src={track.audio_url}>브라우저가 오디오 재생을 지원하지 않습니다.</audio>}
                </div>}
              </div>)}
              {!draft.tracks.length && <div className="music-track-empty"><span>♪</span><b>아직 수록곡이 없습니다.</b><p>한 곡씩 추가하거나 트랙리스트를 한 번에 붙여넣으세요.</p></div>}
            </div>
          </div>}

          {tab === "publish" && <div className="music-section-stack">
            <div className="music-section-title music-release-heading"><div><p className="music-kicker">RELEASE CHECK</p><h3>공개 설정</h3><span>공개 전 필수 정보를 확인하고,<br />연결된 미디어를 마지막으로 점검합니다.</span></div></div>
            <div className="music-publish-summary"><div className="music-publish-cover">{draft.cover_url ? <img src={draft.cover_url} alt="" /> : <span>커버 없음</span>}</div><div><p>{draft.type}</p><h4>{draft.title || "제목 없음"}</h4><span>{draft.release_date || "발매일 미설정"} · {draft.tracks.length}곡</span><div className="music-summary-badges"><AssetBadge active={draft.tracks.some((track) => Boolean(track.audio_url))}>MP3 {draft.tracks.filter((track) => track.audio_url).length}</AssetBadge><AssetBadge active={draft.tracks.some((track) => Boolean(track.music_video_url))}>MV {draft.tracks.filter((track) => track.music_video_url).length}</AssetBadge><AssetBadge active={draft.tracks.some((track) => Boolean(track.logo_url))}>Logo {draft.tracks.filter((track) => track.logo_url).length}</AssetBadge></div></div></div>
            <div className={`music-publish-check ${validation?.canPublish ? "is-ready" : ""}`}><span>{validation?.canPublish ? "✓" : "!"}</span><div><b>{validation?.canPublish ? "공개할 준비가 되었습니다." : "공개 전 확인이 필요합니다."}</b><p>{validation?.canPublish ? "필수 정보가 모두 입력되었습니다." : validation?.publishIssues.join(" · ")}</p></div></div>
            <label className="music-publish-toggle"><span><b>웹사이트에 공개</b><small>공개하면 디스코그래피에서 앨범과 업로드한 음원을 볼 수 있습니다.</small></span><input type="checkbox" checked={draft.is_published} onChange={(event) => { if (event.target.checked && !validation?.canPublish) { setError(`공개 전 확인: ${validation?.publishIssues.join(", ")}`); return; } patchDraft({ is_published: event.target.checked }); }} /></label>
          </div>}
        </div>
      </>}
    </section>

    {bulkOpen && <div className="music-crop-modal" role="dialog" aria-modal="true" aria-label="여러 트랙 붙여넣기"><div className="music-bulk-card"><p className="music-kicker">BULK TRACKS</p><h3>여러 곡 붙여넣기</h3><p>한 줄에 한 곡씩 입력하세요. 재생 시간은 탭으로 구분하며, 앞의 번호는 자동으로 제거합니다.</p><pre>01. Lucky You{String.fromCharCode(9)}3:18{"\n"}02. Glow Up{String.fromCharCode(9)}2:57</pre><textarea className="admin-input" rows={10} value={bulkValue} onChange={(event) => setBulkValue(event.target.value)} autoFocus placeholder="곡명 또는 곡명    3:18" /><div><button type="button" className="admin-btn admin-btn-secondary" onClick={() => setBulkOpen(false)}>취소</button><button type="button" className="admin-btn admin-btn-primary" onClick={applyBulk}>트랙 추가</button></div></div></div>}
  </div>;
}
