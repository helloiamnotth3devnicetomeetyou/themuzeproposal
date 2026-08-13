"use client";

import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
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
  verticalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Image as ImageIcon, Plus, Search } from "lucide-react";
import DeleteConfirmDialog from "@/admin/components/shell/DeleteConfirmDialog";
import DraftSaveButton from "@/admin/components/content/DraftSaveButton";
import { AdminToast } from "@/admin/components/feedback/AdminFeedback";
import { useDraftBackup } from "@/admin/hooks/useDraftBackup";
import AdminAssetImage from "@/admin/components/assets/AdminAssetImage";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import CustomSelect from "@/core/components/form/CustomSelect";
import { supabase } from "@/core/supabase/client";
import { revalidatePublicCache } from "@/core/utils/public-cache";
import {
  SlideDragOverlay,
  SortableSlideCard,
  type HeroAlbum as Album,
  type HeroArtist as Artist,
  type HeroSlide,
} from "./HeroSlideCard";
import { createHeroSlideDraft, getActiveHeroSlides } from "./hero-model";
type SortMode = "hero" | "newest" | "title";

export default function HeroAdminPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [storedSlides, setStoredSlides] = useState<HeroSlide[]>([]);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [orderSnapshot, setOrderSnapshot] = useState("[]");
  const [artistId, setArtistId] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("hero");
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
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 140, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    const [
      { data: artistData, error: artistError },
      { data: albumData, error: albumError },
      { data: slideData, error: slideError },
    ] = await Promise.all([
      supabase
        .from("artists")
        .select("id, name, slug, color")
        .order("name", { ascending: true }),
      supabase
        .from("albums")
        .select(
          "id, artist_id, title, type, cover_url, hero_image_url, color, release_date, is_published, published_at",
        )
        .order("sort_order", { ascending: true }),
      supabase
        .from("home_hero_slides")
        .select("id, album_id, sort_order, is_active, video_url")
        .order("sort_order", { ascending: true }),
    ]);

    if (artistError || albumError || slideError) {
      setError(
        artistError?.message ||
          albumError?.message ||
          slideError?.message ||
          "메인 앨범 정보를 불러오지 못했습니다.",
      );
    } else {
      setArtists((artistData ?? []) as Artist[]);
      setAlbums((albumData ?? []) as Album[]);
      const nextSlides = (slideData ?? []) as HeroSlide[];
      const activeSlides = getActiveHeroSlides(nextSlides);
      setStoredSlides(nextSlides);
      setSlides(activeSlides);
      setOrderSnapshot(JSON.stringify(activeSlides));
      setLoadedAt(Date.now());
    }
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => load());
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
  const activeSlide = draggingId
    ? slides.find((slide) => slide.id === draggingId)
    : undefined;
  const activeAlbum = activeSlide
    ? albumById.get(activeSlide.album_id)
    : undefined;
  const activeArtist = activeAlbum
    ? artistById.get(activeAlbum.artist_id)
    : undefined;
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
    setNotice(`‘${album.title}’을(를) 임시 목록에 추가했습니다.`);
  };

  const saveSlides = async () => {
    setSavingId("order");
    setError("");
    const previous = JSON.parse(orderSnapshot) as HeroSlide[];
    const removedIds = previous
      .filter((slide) => !slides.some((item) => item.id === slide.id))
      .map((slide) => slide.id);
    const results = await Promise.all([
      ...(removedIds.length
        ? [supabase.from("home_hero_slides").delete().in("id", removedIds)]
        : []),
      ...slides.map((slide) => supabase.from("home_hero_slides").upsert(slide)),
    ]);
    const saveError = results.find((result) => result.error)?.error;
    if (saveError) setError(saveError.message);
    else {
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
      await revalidatePublicCache("public-home-slides");
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
    const next = arrayMove(slides, fromIndex, toIndex).map(
      (slide, position) => ({ ...slide, sort_order: position + 1 }),
    );
    setSlides(next);
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
    const { error: saveError } = await supabase
      .from("home_hero_slides")
      .update({ video_url: videoUrl })
      .eq("id", slideId);
    setSavingId(null);
    if (saveError) throw saveError;
    const updateVideo = (slide: HeroSlide) =>
      slide.id === slideId ? { ...slide, video_url: videoUrl } : slide;
    setSlides((current) => current.map(updateVideo));
    setStoredSlides((current) => current.map(updateVideo));
    setOrderSnapshot((current) =>
      JSON.stringify((JSON.parse(current) as HeroSlide[]).map(updateVideo)),
    );
    await revalidatePublicCache("public-home-slides");
    setNotice(
      videoUrl ? "히어로 영상을 저장했습니다." : "히어로 영상을 제거했습니다.",
    );
  };

  if (loading)
    return <AdminSkeleton variant="cards" className="min-h-[420px]" rows={4} />;

  return (
    <div className="hero-admin-page">
      <section className="hero-admin-summary">
        <div className="hero-admin-summary-icon">
          <ImageIcon aria-hidden="true" />
        </div>
        <div>
          <h2>공개 앨범의 메인 노출 순서를 관리합니다.</h2>
          <p>
            앨범의 기본 정렬과 별개로, 홈 화면에 보여줄 앨범과 노출 여부를
            이곳에서 지정합니다.
          </p>
        </div>
        <dl>
          <div>
            <dt>등록</dt>
            <dd>{slides.length}</dd>
          </div>
          <div>
            <dt>공개 방식</dt>
            <dd className="is-label">자동</dd>
          </div>
        </dl>
        <div className="hero-admin-save-actions">
          <DraftSaveButton
            snapshot={orderSnapshot}
            draft={slides}
            dirty={orderDirty}
            saving={savingId === "order"}
            onSave={saveSlides}
            labels={{ $root: "메인 노출 목록" }}
          />
        </div>
      </section>

      {recovery && (
        <div className="content-draft-recovery" role="status">
          <p>
            <b>저장하지 않은 임시 작업이 있습니다.</b>
            <span>
              {new Date(recovery.updatedAt).toLocaleString("ko-KR")} 자동 백업
            </span>
          </p>
          <button
            type="button"
            data-tour-id="draft-discard"
            onClick={discardBackup}
          >
            삭제
          </button>
          <button
            type="button"
            data-tour-id="draft-restore"
            onClick={restoreBackup}
          >
            복구
          </button>
        </div>
      )}

      {error && (
        <div className="hero-admin-alert is-error" role="alert">
          <b>!</b>
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>
            닫기
          </button>
        </div>
      )}
      <AdminToast message={videoStatus || notice} />

      <section className="hero-admin-panel hero-admin-queue">
        <div className="hero-admin-panel-heading">
          <div>
            <h3>메인 슬라이드 순서</h3>
            <p>
              드래그한 순서는 브라우저 임시 작업에 적용되며 상단 저장 시
              공개됩니다.
            </p>
          </div>
          <em>총 {slides.length}개</em>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragCancel={handleDragCancel}
          onDragEnd={(event) => void handleDragEnd(event)}
        >
          <SortableContext
            items={slides.map((slide) => slide.id)}
            strategy={verticalListSortingStrategy}
          >
            <div
              className={`hero-slide-strip ${draggingId ? "is-sorting" : ""}`}
            >
              {slides.map((slide, index) => {
                const album = albumById.get(slide.album_id);
                const artist = album
                  ? artistById.get(album.artist_id)
                  : undefined;
                return (
                  <SortableSlideCard
                    key={slide.id}
                    slide={slide}
                    index={index}
                    album={album}
                    artist={artist}
                    live={album ? isLiveAlbum(album) : false}
                    accent={album?.color || artist?.color || BRAND_PINK_HEX}
                    disabled={Boolean(savingId)}
                    onMoveUp={() => moveSlide(index, -1)}
                    onMoveDown={() => moveSlide(index, 1)}
                    canMoveUp={index > 0}
                    canMoveDown={index < slides.length - 1}
                    onRemove={() => setDeleteSlideItem(slide)}
                    onVideoChange={(videoUrl) =>
                      saveSlideVideo(slide.id, videoUrl)
                    }
                    onVideoStatus={setVideoStatus}
                  />
                );
              })}
              {!slides.length && (
                <div className="hero-admin-empty">
                  <ImageIcon aria-hidden="true" />
                  <b>메인에 등록된 앨범이 없습니다.</b>
                  <span>
                    아래 앨범 라이브러리에서 노출할 앨범을 추가해 주세요.
                  </span>
                </div>
              )}
            </div>
          </SortableContext>
          <DragOverlay
            adjustScale={false}
            dropAnimation={{
              duration: 220,
              easing: "cubic-bezier(.18,.86,.28,1)",
            }}
          >
            {activeSlide ? (
              <SlideDragOverlay
                index={slides.findIndex((slide) => slide.id === activeSlide.id)}
                album={activeAlbum}
                artist={activeArtist}
                accent={
                  activeAlbum?.color || activeArtist?.color || BRAND_PINK_HEX
                }
                videoUrl={activeSlide.video_url}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </section>

      <section className="hero-admin-panel hero-admin-catalog">
        <div className="hero-admin-panel-heading">
          <div>
            <h3>앨범 라이브러리</h3>
            <p>현재 공개 중인 앨범만 메인 목록에 추가할 수 있습니다.</p>
          </div>
          <em>{matchingAlbums.length}개 앨범</em>
        </div>
        <div className="hero-admin-filters">
          <label className="hero-admin-search">
            <Search aria-hidden="true" />
            <span className="sr-only">앨범 검색</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="앨범명 또는 아티스트 검색"
            />
          </label>
          <CustomSelect
            ariaLabel="아티스트 선택"
            value={artistId}
            onChange={setArtistId}
            options={[
              { value: "all", label: "모든 아티스트" },
              ...artists.map((artist) => ({
                value: artist.id,
                label: artist.name,
              })),
            ]}
          />
          <CustomSelect
            ariaLabel="정렬 방식"
            value={sort}
            onChange={(value) => setSort(value as SortMode)}
            options={[
              { value: "hero", label: "메인 노출 순" },
              { value: "newest", label: "발매일 최신순" },
              { value: "title", label: "앨범명 가나다순" },
            ]}
          />
        </div>
        <div className="hero-admin-catalog-grid">
          {matchingAlbums.map((album) => {
            const artist = artistById.get(album.artist_id);
            const selected = selectedAlbumIds.has(album.id);
            return (
              <article
                key={album.id}
                className={`hero-admin-catalog-item ${selected ? "is-selected" : ""}`}
              >
                <span
                  className="hero-admin-catalog-cover"
                  style={
                    {
                      "--album-color":
                        album.color || artist?.color || BRAND_PINK_HEX,
                    } as CSSProperties
                  }
                >
                  {album.cover_url ? (
                    <AdminAssetImage
                      src={album.cover_url}
                      alt=""
                      sizes="64px"
                    />
                  ) : (
                    <i />
                  )}
                </span>
                <div>
                  <b>{album.title}</b>
                  <small>
                    {artist?.name || "THE MUZE"} · {album.type}
                  </small>
                  <em>{album.release_date || "발매일 미지정"}</em>
                </div>
                <button
                  type="button"
                  data-tour-id="hero-add"
                  disabled={selected || savingId === album.id}
                  onClick={() => addSlide(album)}
                >
                  {selected ? (
                    <>
                      <span>추가됨</span>
                    </>
                  ) : (
                    <>
                      <Plus aria-hidden="true" />
                      <span>메인에 추가</span>
                    </>
                  )}
                </button>
              </article>
            );
          })}
        </div>
        {!matchingAlbums.length && (
          <div className="hero-admin-empty is-compact">
            <Search aria-hidden="true" />
            <b>조건에 맞는 공개 앨범이 없습니다.</b>
            <span>검색어나 아티스트 필터를 바꿔 보세요.</span>
          </div>
        )}
      </section>

      {deleteSlideItem && (
        <DeleteConfirmDialog
          title="메인 목록에서 제외할까요?"
          description="홈 화면에서만 제외되며 앨범과 수록곡 데이터는 그대로 유지됩니다. 이 작업은 되돌릴 수 없습니다."
          confirmValue={
            albumById.get(deleteSlideItem.album_id)?.title || "이 앨범"
          }
          valueLabel="앨범명"
          busy={savingId === deleteSlideItem.id}
          onCancel={() => setDeleteSlideItem(null)}
          onConfirm={() => removeSlide(deleteSlideItem)}
        />
      )}
    </div>
  );
}
