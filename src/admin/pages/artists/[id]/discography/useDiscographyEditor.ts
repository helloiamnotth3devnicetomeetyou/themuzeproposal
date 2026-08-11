"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ConfirmOptions } from "@/admin/components/shell/AdminDialogProvider";
import { useAdminEntityEditor } from "@/admin/hooks/useAdminEntityEditor";
import { useAdminPreview } from "@/admin/hooks/useAdminPreview";
import { usePageDrafts } from "@/admin/hooks/usePageDrafts";
import { adminDbError } from "@/admin/utils/admin-db-error";
import { supabase } from "@/core/supabase/client";
import { revalidatePublicCache } from "@/core/utils/public-cache";
import {
  type AlbumEditorDraft,
  type EditorTab,
  managedAssetFromUrl,
  parseBulkTracks,
  type TrackDraft,
  type UploadedAsset,
  validateAlbum,
} from "@/core/utils/music-editor";
import {
  albumSelect,
  albumToDraft,
  collectAssetUrls,
  createAlbumDraft,
  filterAlbums,
  legacyAlbumSelect,
  type RawAlbum,
} from "./discography-editor-model";

export type DiscographyFilter = "all" | "published" | "draft";
export type DiscographyLanguage = "ko" | "en" | "ja";

type RequestConfirm = (options: ConfirmOptions) => Promise<boolean>;

export function useDiscographyEditor({ routeArtistId, requestConfirm }: { routeArtistId?: string; requestConfirm: RequestConfirm }) {
  const [artistId, setArtistId] = useState("");
  const [artistName, setArtistName] = useState("");
  const [artistSlug, setArtistSlug] = useState("");
  const [albums, setAlbums] = useState<AlbumEditorDraft[]>([]);
  const [tab, setTab] = useState<EditorTab>("basic");
  const [language, setLanguage] = useState<DiscographyLanguage>("ko");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<DiscographyFilter>("all");
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkValue, setBulkValue] = useState("");
  const [sorting, setSorting] = useState(false);
  const [sortDirty, setSortDirty] = useState(false);
  const [dragAlbum, setDragAlbum] = useState<string | null>(null);
  const [dragTrack, setDragTrack] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState(false);
  const uploadedAssets = useRef<UploadedAsset[]>([]);

  const editor = useAdminEntityEditor<AlbumEditorDraft>({
    initialDraft: null,
    storageKey: `admin-draft:discography:${routeArtistId}`,
  });
  const {
    draft,
    setDraft,
    setSnapshot,
    dirty,
    setLoading,
    setSaving,
    setDeleting,
    setDeleteOpen,
    setError,
    setToast,
    patchDraft,
    discardDraftBackup = () => {},
  } = editor;

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
    unavailableMessage: "미리보기를 열 수 없습니다.",
    onError: setError,
  });

  const syncUrl = useCallback((albumId: string, nextTab: EditorTab) => {
    const params = new URLSearchParams(window.location.search);
    params.set("album", albumId);
    params.set("tab", nextTab);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, []);

  const loadAlbums = useCallback(async (preferredId?: string) => {
    setLoading(true);
    setError("");
    const { data: artist, error: artistError } = await supabase.from("artists").select("id,name,slug").eq("id", routeArtistId).maybeSingle();
    if (artistError || !artist) {
      setError("아티스트 정보를 불러오지 못했습니다.");
      setLoading(false);
      return;
    }
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
    if (albumError) {
      setError(albumError.message.includes("spotify_url") ? "음악 편집 DB 마이그레이션(003_music_editor.sql)을 먼저 적용해 주세요." : albumError.message);
      setLoading(false);
      return;
    }
    const nextAlbums = (albumRows ?? []).map(albumToDraft);
    setArtistId(artist.id);
    setArtistName(artist.name || "");
    setArtistSlug(artist.slug || "");
    setAlbums(nextAlbums);
    const params = new URLSearchParams(window.location.search);
    const requestedId = preferredId || params.get("album") || nextAlbums[0]?.id;
    const selected = nextAlbums.find((album) => album.id === requestedId) ?? nextAlbums[0] ?? null;
    const requestedTab = params.get("tab");
    const nextTab: EditorTab = requestedTab === "content" || requestedTab === "tracks" || requestedTab === "gallery" || requestedTab === "publish" ? requestedTab : "basic";
    setDraft(selected);
    setSnapshot(selected ? JSON.stringify(selected) : "");
    setTab(nextTab);
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
    const queued = [...uploadedAssets.current];
    uploadedAssets.current = [];
    if (queued.length) await removeAssets(queued);
  };

  const selectAlbum = async (album: AlbumEditorDraft) => {
    if ((dirty || pendingDelete) && !await requestConfirm({
      title: "변경사항을 버릴까요?",
      description: "현재 앨범에서 저장하지 않은 정보와 업로드 대기 파일이 사라집니다. 다른 앨범을 열기 전에 한 번 더 확인해 주세요.",
      confirmLabel: "버리고 열기",
      tone: "danger",
    })) return;
    await discardQueuedUploads();
    setPendingDelete(false);
    setDraft(album);
    setSnapshot(JSON.stringify(album));
    setTab("basic");
    setError("");
    setExpandedTrack(null);
    syncUrl(album.id, "basic");
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
    const next = createAlbumDraft(artistId, albums.length + 1);
    setPendingDelete(false);
    setDraft(next);
    setSnapshot(JSON.stringify(next));
    setTab("basic");
    setExpandedTrack(null);
    syncUrl(next.id, "basic");
  };

  const changeTab = (next: EditorTab) => { if (draft) { setTab(next); syncUrl(draft.id, next); } };
  const handleTitle = (title: string) => patchDraft({ title, title_ko: draft?.title_ko || title });
  const registerUpload = (asset: UploadedAsset) => { uploadedAssets.current.push(asset); };

  const save = async () => {
    if (!draft || !validation?.canSave) { setError(`저장 전 확인: ${validation?.saveIssues.join(", ") || "필수 정보를 확인해 주세요."}`); return; }
    if (draft.is_published && !validation.canPublish) { setError(`공개 전 확인: ${validation.publishIssues.join(", ")}`); setTab("publish"); return; }
    setSaving(true);
    setError("");
    const original = albums.find((album) => album.id === draft.id);
    const { tracks, ...albumDraft } = draft;
    const albumPayload = { ...albumDraft, title_ko: draft.title_ko.trim() || draft.title, title_en: draft.title_en.trim() || null, title_ja: draft.title_ja.trim() || null, slug: draft.id };
    const localizedTracks = tracks.map((track) => ({ ...track, title_ko: track.title_ko.trim() || track.title, title_en: track.title_en.trim() || null, title_ja: track.title_ja.trim() || null }));
    const { data, error: saveError } = await supabase.rpc("save_album_with_tracks", { p_album: albumPayload, p_tracks: localizedTracks });
    if (saveError) { setSaving(false); setError(adminDbError(saveError, "앨범을 저장하지 못했습니다.")); return; }

    const savedAlbumId = String(data ?? draft.id);
    const [{ error: localizedAlbumError }, ...localizedTrackResults] = await Promise.all([
      supabase.from("albums").update({ hero_image_url: draft.hero_image_url || null, typo_logo_url: draft.typo_logo_url || null, title_ko: draft.title_ko.trim() || draft.title, title_en: draft.title_en.trim() || null, title_ja: draft.title_ja.trim() || null }).eq("id", savedAlbumId),
      ...localizedTracks.map((track) => supabase.from("tracks").update({ title_ko: track.title_ko, title_en: track.title_en, title_ja: track.title_ja }).eq("id", track.id)),
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
    setSaving(false);
    setToast("변경사항을 저장했습니다.");
    discardDraftBackup();
    await revalidatePublicCache("public-home-slides");
    await loadAlbums(savedAlbumId);
  };

  const removeAlbum = async () => {
    if (!draft || !albums.some((album) => album.id === draft.id)) return;
    setDeleting(true);
    const assets = [...collectAssetUrls(draft)].map(managedAssetFromUrl).filter(Boolean);
    const { error: deleteError } = await supabase.from("albums").delete().eq("id", draft.id);
    if (deleteError) { setDeleting(false); setDeleteOpen(false); setError(deleteError.message); return; }
    await Promise.all(assets.map((asset) => supabase.storage.from(asset!.bucket).remove([asset!.path])));
    setDeleting(false);
    setDeleteOpen(false);
    setToast("앨범을 삭제했습니다.");
    await revalidatePublicCache("public-home-slides");
    await loadAlbums();
  };

  const reorderAlbum = (targetId: string) => {
    if (!dragAlbum || dragAlbum === targetId) return;
    setAlbums((current) => { const next = [...current]; const from = next.findIndex((album) => album.id === dragAlbum); const to = next.findIndex((album) => album.id === targetId); const [moved] = next.splice(from, 1); next.splice(to, 0, moved); return next; });
    setSortDirty(true);
    setDragAlbum(null);
  };
  const saveOrder = async () => {
    const { error: orderError } = await supabase.rpc("reorder_albums", { p_artist_id: artistId, p_album_ids: albums.map((album) => album.id) });
    if (orderError) return setError(orderError.message);
    setSortDirty(false);
    setSorting(false);
    setToast("앨범 순서를 저장했습니다.");
    await revalidatePublicCache("public-home-slides");
    await loadAlbums(draft?.id);
  };
  const reorderTrack = (targetId: string) => {
    if (!draft || !dragTrack || dragTrack === targetId) return;
    const next = [...draft.tracks];
    const from = next.findIndex((track) => track.id === dragTrack);
    const to = next.findIndex((track) => track.id === targetId);
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    patchDraft({ tracks: next });
    setDragTrack(null);
  };
  const applyBulk = () => {
    if (!draft) return;
    const parsed = parseBulkTracks(bulkValue);
    if (!parsed.length) return setError("붙여넣은 트랙을 찾지 못했습니다.");
    patchDraft({ tracks: [...draft.tracks, ...parsed] });
    setBulkOpen(false);
    setBulkValue("");
    setTab("tracks");
  };

  return {
    ...editor,
    artistId, artistName, artistSlug, albums, tab, setTab, language, setLanguage, search, setSearch, filter, setFilter,
    expandedTrack, setExpandedTrack, bulkOpen, setBulkOpen, bulkValue, setBulkValue, sorting, setSorting, sortDirty,
    setSortDirty, setDragAlbum, dragTrack, setDragTrack, pendingDelete, setPendingDelete, validation, nestedDrafts,
    previewPayload, openPreview, patchTrack, selectAlbum, addAlbum, changeTab, handleTitle, registerUpload, save,
    removeAlbum, reorderAlbum, saveOrder, reorderTrack, applyBulk, visibleAlbums: filterAlbums(albums, search, filter),
  };
}
