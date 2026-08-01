"use client";

import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import {
  LuImage,
  LuPlus,
  LuRefreshCw,
  LuSearch,
} from "react-icons/lu";
import DeleteConfirmDialog from "@/admin/components/shell/DeleteConfirmDialog";
import AdminAssetImage from "@/admin/components/assets/AdminAssetImage";
import LoadingIndicator from "@/core/components/feedback/LoadingIndicator";
import CustomSelect from "@/core/components/form/CustomSelect";
import { supabase } from "@/core/supabase/client";
import {
  SlideDragOverlay,
  SortableSlideCard,
  type HeroAlbum as Album,
  type HeroArtist as Artist,
  type HeroSlide,
} from "./HeroSlideCard";
type SortMode = "hero" | "newest" | "title";

const revalidateHomeSlides = () => fetch("/api/admin/revalidate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ tag: "public-home-slides" }),
}).catch(() => undefined);

export default function HeroAdminPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [artistId, setArtistId] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("hero");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loadedAt, setLoadedAt] = useState(0);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [deleteSlideItem, setDeleteSlideItem] = useState<HeroSlide | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 140, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    const [{ data: artistData, error: artistError }, { data: albumData, error: albumError }, { data: slideData, error: slideError }] = await Promise.all([
      supabase.from("artists").select("id, name, slug, color").order("name", { ascending: true }),
      supabase.from("albums").select("id, artist_id, title, type, cover_url, hero_image_url, color, release_date, is_published, published_at").order("sort_order", { ascending: true }),
      supabase.from("home_hero_slides").select("id, album_id, sort_order, is_active").order("sort_order", { ascending: true }),
    ]);

    if (artistError || albumError || slideError) {
      setError(artistError?.message || albumError?.message || slideError?.message || "메인 앨범 정보를 불러오지 못했습니다.");
    } else {
      setArtists((artistData ?? []) as Artist[]);
      setAlbums((albumData ?? []) as Album[]);
      const nextSlides = (slideData ?? []) as HeroSlide[];
      const hiddenIds = nextSlides.filter((slide) => !slide.is_active).map((slide) => slide.id);
      if (hiddenIds.length) {
        const { error: activationError } = await supabase.from("home_hero_slides").update({ is_active: true }).in("id", hiddenIds);
        if (activationError) setError(activationError.message);
      }
      setSlides(nextSlides.map((slide) => ({ ...slide, is_active: true })));
      setLoadedAt(Date.now());
    }
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => { void Promise.resolve().then(() => load()); }, [load]);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 2400);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const artistById = useMemo(() => new Map(artists.map((artist) => [artist.id, artist])), [artists]);
  const albumById = useMemo(() => new Map(albums.map((album) => [album.id, album])), [albums]);
  const selectedAlbumIds = useMemo(() => new Set(slides.map((slide) => slide.album_id)), [slides]);
  const isLiveAlbum = useCallback((album: Album) => album.is_published && Boolean(album.published_at) && new Date(album.published_at!).getTime() <= loadedAt, [loadedAt]);

  const matchingAlbums = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return albums
      .filter(isLiveAlbum)
      .filter((album) => artistId === "all" || album.artist_id === artistId)
      .filter((album) => {
        if (!keyword) return true;
        const artist = artistById.get(album.artist_id);
        return `${album.title} ${album.type} ${artist?.name ?? ""} ${artist?.slug ?? ""}`.toLowerCase().includes(keyword);
      })
      .sort((a, b) => {
        if (sort === "title") return a.title.localeCompare(b.title);
        if (sort === "newest") return (b.release_date || "").localeCompare(a.release_date || "");
        const aOrder = slides.findIndex((slide) => slide.album_id === a.id);
        const bOrder = slides.findIndex((slide) => slide.album_id === b.id);
        return (aOrder < 0 ? Number.MAX_SAFE_INTEGER : aOrder) - (bOrder < 0 ? Number.MAX_SAFE_INTEGER : bOrder) || (b.release_date || "").localeCompare(a.release_date || "");
      });
  }, [albums, artistById, artistId, isLiveAlbum, query, slides, sort]);
  const activeSlide = draggingId ? slides.find((slide) => slide.id === draggingId) : undefined;
  const activeAlbum = activeSlide ? albumById.get(activeSlide.album_id) : undefined;
  const activeArtist = activeAlbum ? artistById.get(activeAlbum.artist_id) : undefined;

  const addSlide = async (album: Album) => {
    setSavingId(album.id);
    setError("");
    const sortOrder = Math.max(0, ...slides.map((slide) => slide.sort_order)) + 1;
    const { error: insertError } = await supabase.from("home_hero_slides").insert({ album_id: album.id, sort_order: sortOrder, is_active: true });
    if (insertError) setError(insertError.message);
    else { void revalidateHomeSlides(); setNotice(`‘${album.title}’을(를) 메인에 추가하고 공개했습니다.`); await load(true); }
    setSavingId(null);
  };

  const persistOrder = async (next: HeroSlide[], rollback: HeroSlide[] = slides) => {
    setSavingId("order");
    setError("");
    const results = await Promise.all(next.map((slide) => supabase.from("home_hero_slides").update({ sort_order: slide.sort_order }).eq("id", slide.id)));
    const orderError = results.find((result) => result.error)?.error;
    if (orderError) { setSlides(rollback); setError(orderError.message); }
    else { void revalidateHomeSlides(); setNotice("메인 노출 순서를 저장했습니다."); }
    setSavingId(null);
  };

  const handleDragStart = ({ active }: DragStartEvent) => setDraggingId(String(active.id));
  const handleDragCancel = () => setDraggingId(null);
  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setDraggingId(null);
    if (!over || active.id === over.id) return;
    const fromIndex = slides.findIndex((slide) => slide.id === active.id);
    const toIndex = slides.findIndex((slide) => slide.id === over.id);
    if (fromIndex < 0 || toIndex < 0) return;
    const previous = [...slides];
    const next = arrayMove(slides, fromIndex, toIndex).map((slide, position) => ({ ...slide, sort_order: position + 1 }));
    setSlides(next);
    await persistOrder(next, previous);
  };

  const removeSlide = async (slide: HeroSlide) => {
    setSavingId(slide.id);
    setError("");
    const { error: deleteError } = await supabase.from("home_hero_slides").delete().eq("id", slide.id);
    if (deleteError) setError(deleteError.message);
    else {
      void revalidateHomeSlides();
      setSlides((current) => current.filter((item) => item.id !== slide.id).map((item, index) => ({ ...item, sort_order: index + 1 })));
      setNotice("메인 목록에서 제외했습니다.");
    }
    setSavingId(null);
    setDeleteSlideItem(null);
  };

  if (loading) return <LoadingIndicator label="메인 앨범 목록을 불러오는 중…" className="min-h-[420px] bg-[var(--bg-card)]" />;

  return (
    <div className="hero-admin-page">
      <section className="hero-admin-summary">
        <div className="hero-admin-summary-icon"><LuImage aria-hidden="true" /></div>
        <div>
          <h2>공개 앨범의 메인 노출 순서를 관리합니다.</h2>
          <p>앨범의 기본 정렬과 별개로, 홈 화면에 보여줄 앨범과 노출 여부를 이곳에서 지정합니다.</p>
        </div>
        <dl>
          <div><dt>등록</dt><dd>{slides.length}</dd></div>
          <div><dt>공개 방식</dt><dd className="is-label">자동</dd></div>
        </dl>
        <button type="button" className="hero-admin-refresh" onClick={() => void load(true)} disabled={Boolean(savingId)}>
          <LuRefreshCw aria-hidden="true" /> 새로고침
        </button>
      </section>

      {error && <div className="hero-admin-alert is-error" role="alert"><b>!</b><span>{error}</span><button type="button" onClick={() => setError("")}>닫기</button></div>}
      {notice && <div className="content-workbench-toast" role="status">{notice}</div>}

      <section className="hero-admin-panel hero-admin-queue">
        <div className="hero-admin-panel-heading">
          <div><h3>메인 슬라이드 순서</h3><p>슬라이드를 잡아 원하는 위치에 놓으면 주변 카드가 자리를 만들고 순서가 저장됩니다.</p></div>
          <em>총 {slides.length}개</em>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragCancel={handleDragCancel} onDragEnd={(event) => void handleDragEnd(event)}>
          <SortableContext items={slides.map((slide) => slide.id)} strategy={horizontalListSortingStrategy}>
            <div className={`hero-slide-strip ${draggingId ? "is-sorting" : ""}`}>
              {slides.map((slide, index) => {
                const album = albumById.get(slide.album_id);
                const artist = album ? artistById.get(album.artist_id) : undefined;
                 return <SortableSlideCard key={slide.id} slide={slide} index={index} album={album} artist={artist} live={album ? isLiveAlbum(album) : false} accent={album?.color || artist?.color || BRAND_PINK_HEX} disabled={Boolean(savingId)} onRemove={() => setDeleteSlideItem(slide)} />;
              })}
              {!slides.length && <div className="hero-admin-empty"><LuImage aria-hidden="true" /><b>메인에 등록된 앨범이 없습니다.</b><span>아래 앨범 라이브러리에서 노출할 앨범을 추가해 주세요.</span></div>}
            </div>
          </SortableContext>
          <DragOverlay adjustScale={false} dropAnimation={{ duration: 220, easing: "cubic-bezier(.18,.86,.28,1)" }}>
            {activeSlide ? <SlideDragOverlay index={slides.findIndex((slide) => slide.id === activeSlide.id)} album={activeAlbum} artist={activeArtist} accent={activeAlbum?.color || activeArtist?.color || BRAND_PINK_HEX} /> : null}
          </DragOverlay>
        </DndContext>
      </section>

      <section className="hero-admin-panel hero-admin-catalog">
        <div className="hero-admin-panel-heading">
          <div><h3>앨범 라이브러리</h3><p>현재 공개 중인 앨범만 메인 목록에 추가할 수 있습니다.</p></div>
          <em>{matchingAlbums.length}개 앨범</em>
        </div>
        <div className="hero-admin-filters">
          <label className="hero-admin-search"><LuSearch aria-hidden="true" /><span className="sr-only">앨범 검색</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="앨범명 또는 아티스트 검색" /></label>
          <CustomSelect ariaLabel="아티스트 선택" value={artistId} onChange={setArtistId} options={[{ value: "all", label: "모든 아티스트" }, ...artists.map((artist) => ({ value: artist.id, label: artist.name }))]} />
          <CustomSelect ariaLabel="정렬 방식" value={sort} onChange={(value) => setSort(value as SortMode)} options={[{ value: "hero", label: "메인 노출 순" }, { value: "newest", label: "발매일 최신순" }, { value: "title", label: "앨범명 가나다순" }]} />
        </div>
        <div className="hero-admin-catalog-grid">
          {matchingAlbums.map((album) => {
            const artist = artistById.get(album.artist_id);
            const selected = selectedAlbumIds.has(album.id);
            return (
              <article key={album.id} className={`hero-admin-catalog-item ${selected ? "is-selected" : ""}`}>
                <span className="hero-admin-catalog-cover" style={{ "--album-color": album.color || artist?.color || BRAND_PINK_HEX } as CSSProperties}>
                  {album.cover_url ? <AdminAssetImage src={album.cover_url} alt="" sizes="64px" /> : <i />}
                </span>
                <div><b>{album.title}</b><small>{artist?.name || "THE MUZE"} · {album.type}</small><em>{album.release_date || "발매일 미지정"}</em></div>
                <button type="button" disabled={selected || savingId === album.id} onClick={() => void addSlide(album)}>{selected ? <><span>추가됨</span></> : <><LuPlus aria-hidden="true" /><span>메인에 추가</span></>}</button>
              </article>
            );
          })}
        </div>
        {!matchingAlbums.length && <div className="hero-admin-empty is-compact"><LuSearch aria-hidden="true" /><b>조건에 맞는 공개 앨범이 없습니다.</b><span>검색어나 아티스트 필터를 바꿔 보세요.</span></div>}
      </section>

      {deleteSlideItem && (
        <DeleteConfirmDialog
          title="메인 목록에서 제외할까요?"
          description="홈 화면에서만 제외되며 앨범과 수록곡 데이터는 그대로 유지됩니다. 이 작업은 되돌릴 수 없습니다."
          confirmValue={albumById.get(deleteSlideItem.album_id)?.title || "이 앨범"}
          valueLabel="앨범명"
          busy={savingId === deleteSlideItem.id}
          onCancel={() => setDeleteSlideItem(null)}
          onConfirm={() => void removeSlide(deleteSlideItem)}
        />
      )}
    </div>
  );
}
