"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import { useDraftBackup } from "@/admin/hooks/useDraftBackup";
import { createHeroSlideDraft } from "./hero-model";
import {
  type HeroAlbum as Album,
  type HeroArtist as Artist,
  type HeroSlide,
} from "./HeroSlideCard";
import HeroAlbumCatalog, { type HeroSortMode } from "./HeroAlbumCatalog";
import HeroSlideEditor from "./HeroSlideEditor";
import {
  loadHeroData,
  saveHeroSlideVideo,
  saveHeroSlides,
} from "./hero-actions";

export default function HeroAdminPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [storedSlides, setStoredSlides] = useState<HeroSlide[]>([]);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [orderSnapshot, setOrderSnapshot] = useState("[]");
  const [revision, setRevision] = useState<string | null>(null);
  const [artistId, setArtistId] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<HeroSortMode>("hero");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [videoStatus, setVideoStatus] = useState<string | null>(null);
  const [loadedAt, setLoadedAt] = useState(0);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [deleteSlideItem, setDeleteSlideItem] = useState<HeroSlide | null>(
    null,
  );

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const result = await loadHeroData();
      setArtists(result.artists);
      setAlbums(result.albums);
      setStoredSlides(result.storedSlides);
      setSlides(result.slides);
      setOrderSnapshot(JSON.stringify(result.slides));
      setRevision(result.revision);
      setLoadedAt(Date.now());
    } catch (loadError) {
      const message =
        loadError && typeof loadError === "object" && "message" in loadError
          ? String(loadError.message)
          : "메인 노출 정보를 불러오지 못했습니다.";
      setError(message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 2400);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const artistById = useMemo(
    () => new Map(artists.map((artist) => [artist.id, artist])),
    [artists],
  );
  const albumById = useMemo(
    () => new Map(albums.map((album) => [album.id, album])),
    [albums],
  );
  const selectedAlbumIds = useMemo(
    () => new Set(slides.map((slide) => slide.album_id)),
    [slides],
  );
  const isLiveAlbum = useCallback(
    (album: Album) =>
      album.is_published &&
      Boolean(album.published_at) &&
      new Date(album.published_at!).getTime() <= loadedAt,
    [loadedAt],
  );
  const matchingAlbums = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return albums
      .filter(isLiveAlbum)
      .filter((album) => artistId === "all" || album.artist_id === artistId)
      .filter((album) => {
        if (!keyword) return true;
        const artist = artistById.get(album.artist_id);
        return `${album.title} ${album.type} ${artist?.name ?? ""} ${artist?.slug ?? ""}`
          .toLowerCase()
          .includes(keyword);
      })
      .sort((a, b) => {
        if (sort === "title") return a.title.localeCompare(b.title);
        if (sort === "newest")
          return (b.release_date || "").localeCompare(a.release_date || "");
        const aOrder = slides.findIndex((slide) => slide.album_id === a.id);
        const bOrder = slides.findIndex((slide) => slide.album_id === b.id);
        return (
          (aOrder < 0 ? Number.MAX_SAFE_INTEGER : aOrder) -
            (bOrder < 0 ? Number.MAX_SAFE_INTEGER : bOrder) ||
          (b.release_date || "").localeCompare(a.release_date || "")
        );
      });
  }, [albums, artistById, artistId, isLiveAlbum, query, slides, sort]);

  const orderDirty = JSON.stringify(slides) !== orderSnapshot;
  const restoreSlides = useCallback(
    (saved: HeroSlide[]) => setSlides(saved),
    [],
  );
  const { recovery, restoreBackup, discardBackup } = useDraftBackup({
    key: "admin-draft:hero",
    draft: slides,
    snapshot: orderSnapshot,
    dirty: orderDirty,
    restore: restoreSlides,
  });

  const addSlide = (album: Album) => {
    setSlides((current) => [
      ...current,
      createHeroSlideDraft(current, storedSlides, album.id),
    ]);
    setNotice(`${album.title}을(를) 임시 목록에 추가했습니다.`);
  };

  const saveSlides = async () => {
    setSavingId("order");
    setError("");
    const {
      data,
      error: saveError,
      removedIds,
    } = await saveHeroSlides({
      slides,
      orderSnapshot,
      revision,
    });
    if (saveError) {
      setError(
        saveError.code === "P0003"
          ? "다른 관리자가 먼저 수정했습니다. 최신 내용을 불러온 뒤 다시 저장해 주세요."
          : saveError.message,
      );
      if (saveError.code === "P0003") void load(true);
    } else {
      setRevision(data);
      setStoredSlides((current) => {
        const next = new Map(
          current
            .filter((slide) => !removedIds.includes(slide.id))
            .map((slide) => [slide.id, slide]),
        );
        slides.forEach((slide) => next.set(slide.id, slide));
        return [...next.values()].sort((a, b) => a.sort_order - b.sort_order);
      });
      setOrderSnapshot(JSON.stringify(slides));
      discardBackup();
      setNotice("메인 노출 변경사항을 저장했습니다.");
    }
    setSavingId(null);
  };

  const handleDragStart = ({ active }: DragStartEvent) =>
    setDraggingId(String(active.id));
  const handleDragCancel = () => setDraggingId(null);
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggingId(null);
    if (!over || active.id === over.id) return;
    const fromIndex = slides.findIndex((slide) => slide.id === active.id);
    const toIndex = slides.findIndex((slide) => slide.id === over.id);
    if (fromIndex < 0 || toIndex < 0) return;
    setSlides(
      arrayMove(slides, fromIndex, toIndex).map((slide, position) => ({
        ...slide,
        sort_order: position + 1,
      })),
    );
  };

  const removeSlide = (slide: HeroSlide) => {
    setSlides((current) =>
      current
        .filter((item) => item.id !== slide.id)
        .map((item, index) => ({ ...item, sort_order: index + 1 })),
    );
    setNotice("임시 목록에서 제외했습니다. 상단 저장 시 반영됩니다.");
    setDeleteSlideItem(null);
  };
  const moveSlide = (index: number, offset: number) => {
    const target = index + offset;
    if (target < 0 || target >= slides.length) return;
    setSlides(
      arrayMove(slides, index, target).map((slide, position) => ({
        ...slide,
        sort_order: position + 1,
      })),
    );
  };
  const saveSlideVideo = async (slideId: string, videoUrl: string | null) => {
    setSavingId(slideId);
    try {
      const { data, error: saveError } = await saveHeroSlideVideo(
        slideId,
        videoUrl,
        revision,
      );
      if (saveError) {
        setError(saveError.message);
        if (saveError.code === "P0003") void load(true);
        return;
      }
      setRevision(data as string);
      const updateVideo = (slide: HeroSlide) =>
        slide.id === slideId ? { ...slide, video_url: videoUrl } : slide;
      setSlides((current) => current.map(updateVideo));
      setStoredSlides((current) => current.map(updateVideo));
      setOrderSnapshot((current) =>
        JSON.stringify((JSON.parse(current) as HeroSlide[]).map(updateVideo)),
      );
      setNotice(
        videoUrl ? "영상 URL을 저장했습니다." : "영상 URL을 삭제했습니다.",
      );
    } finally {
      setSavingId(null);
    }
  };

  if (loading)
    return <AdminSkeleton variant="cards" className="min-h-[420px]" rows={4} />;

  return (
    <div className="hero-admin-page">
      <HeroSlideEditor
        slides={slides}
        orderSnapshot={orderSnapshot}
        orderDirty={orderDirty}
        savingId={savingId}
        error={error}
        notice={notice}
        videoStatus={videoStatus}
        recovery={recovery}
        draggingId={draggingId}
        deleteSlideItem={deleteSlideItem}
        albumById={albumById}
        artistById={artistById}
        isLiveAlbum={isLiveAlbum}
        onSave={saveSlides}
        onRestoreBackup={restoreBackup}
        onDiscardBackup={discardBackup}
        onClearError={() => setError("")}
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
        onMove={moveSlide}
        onRemoveRequest={setDeleteSlideItem}
        onRemove={removeSlide}
        onCancelRemove={() => setDeleteSlideItem(null)}
        onVideoChange={saveSlideVideo}
        onVideoStatus={setVideoStatus}
      />
      <HeroAlbumCatalog
        artists={artists}
        matchingAlbums={matchingAlbums}
        artistById={artistById}
        selectedAlbumIds={selectedAlbumIds}
        artistId={artistId}
        query={query}
        sort={sort}
        savingId={savingId}
        onArtistChange={setArtistId}
        onQueryChange={setQuery}
        onSortChange={setSort}
        onAdd={addSlide}
      />
    </div>
  );
}
