"use client";

import { useEffect, useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ImagePlus, Plus, Search, Trash2 } from "lucide-react";
import AdminAssetImage from "@/admin/components/assets/AdminAssetImage";
import CustomSelect from "@/core/components/form/CustomSelect";
import {
  MAX_LOGIN_SLIDES,
  type LoginSlide,
  type LoginSlideSource,
} from "@/core/content/login-slides";
import { supabase } from "@/core/supabase/client";

type Candidate = Omit<LoginSlide, "id">;

const sourceLabel: Record<LoginSlideSource, string> = {
  legacy: "기존",
  "album-cover": "앨범 커버",
  "album-hero": "앨범 히어로",
  "scene-hero": "장면 히어로",
  "member-gallery": "멤버 사진첩",
};

const artist = (value: unknown) =>
  (Array.isArray(value) ? value[0] : value) as {
    name?: string;
    is_active?: boolean;
  } | null;

function LoginSlideCard({
  slide,
  index,
  selected,
  onSelect,
  onRemove,
}: {
  slide: LoginSlide;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: slide.id });

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`hero-slide-card ${isDragging ? "is-dragging" : ""}`}
    >
      <div
        className="hero-slide-frame"
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect();
          }
        }}
      >
        <AdminAssetImage src={slide.imageUrl} alt="" sizes="420px" />
        <span className="hero-slide-shade" />
        <span className="hero-slide-position">
          <small>SLIDE</small>
          <b>{String(index + 1).padStart(2, "0")}</b>
        </span>
        <button
          type="button"
          className="hero-slide-grab"
          aria-label={`${slide.title} 순서 변경`}
          title="드래그해 순서 변경"
          onClick={(event) => event.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" />
          <span>순서 이동</span>
        </button>
        <div className="hero-slide-copy">
          <small>{sourceLabel[slide.source]}</small>
          <b>{slide.title}</b>
        </div>
      </div>
      <footer className="hero-slide-footer">
        <span>{selected ? "이미지 풀에서 교체할 이미지를 고르세요" : "카드를 눌러 이미지 교체"}</span>
        <div>
          <button
            type="button"
            className="is-danger"
            aria-label={`${slide.title} 삭제`}
            title="삭제"
            onClick={onRemove}
          >
            <Trash2 aria-hidden="true" />
          </button>
        </div>
      </footer>
    </article>
  );
}

export default function LoginSlidesField({
  value,
  onChange,
}: {
  value: LoginSlide[];
  onChange: (value: LoginSlide[]) => void;
}) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [open, setOpen] = useState(false);
  const [replaceId, setReplaceId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<"all" | LoginSlideSource>("all");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    let alive = true;
    async function load() {
      const [albums, scenes, gallery] = await Promise.all([
        supabase
          .from("albums")
          .select("title,cover_url,hero_image_url,artist:artists!inner(name,is_active)")
          .eq("is_published", true),
        supabase
          .from("artist_scenes")
          .select("title,image_url,artist:artists!inner(name,is_active)")
          .eq("is_hero", true)
          .eq("is_published", true),
        supabase
          .from("artist_gallery")
          .select("caption,image_url,artist:artists!inner(name,is_active)")
          .not("member_id", "is", null)
          .eq("is_published", true),
      ]);
      if (!alive) return;

      const live = (row: { artist?: unknown }) =>
        artist(row.artist)?.is_active === true;
      setCandidates([
        ...((albums.data ?? []) as Array<{
          title: string;
          cover_url: string | null;
          hero_image_url: string | null;
          artist?: unknown;
        }>)
          .filter(live)
          .flatMap((row) => [
            ...(row.cover_url
              ? [{
                  imageUrl: row.cover_url,
                  title: `${artist(row.artist)?.name || "Artist"} · ${row.title}`,
                  source: "album-cover" as const,
                }]
              : []),
            ...(row.hero_image_url
              ? [{
                  imageUrl: row.hero_image_url,
                  title: `${artist(row.artist)?.name || "Artist"} · ${row.title}`,
                  source: "album-hero" as const,
                }]
              : []),
          ]),
        ...((scenes.data ?? []) as Array<{
          title: string;
          image_url: string;
          artist?: unknown;
        }>)
          .filter(live)
          .map((row) => ({
            imageUrl: row.image_url,
            title: `${artist(row.artist)?.name || "Artist"} · ${row.title || "Hero"}`,
            source: "scene-hero" as const,
          })),
        ...((gallery.data ?? []) as Array<{
          caption: string;
          image_url: string;
          artist?: unknown;
        }>)
          .filter(live)
          .map((row) => ({
            imageUrl: row.image_url,
            title: `${artist(row.artist)?.name || "Artist"} · ${row.caption || "Gallery"}`,
            source: "member-gallery" as const,
          })),
      ]);
    }
    void load();
    return () => {
      alive = false;
    };
  }, []);

  const used = new Set(value.map((slide) => slide.imageUrl));
  const visibleCandidates = useMemo(() => {
    const terms = query.trim().toLocaleLowerCase("ko");
    return candidates.filter(
      (candidate) =>
        (source === "all" || candidate.source === source) &&
        (!terms ||
          `${candidate.title} ${sourceLabel[candidate.source]}`
            .toLocaleLowerCase("ko")
            .includes(terms)),
    );
  }, [candidates, query, source]);
  const showPicker = (id: string | null) => {
    setReplaceId(id);
    setOpen(true);
  };
  const choose = (candidate: Candidate) => {
    const replacing = value.find((slide) => slide.id === replaceId);
    if (used.has(candidate.imageUrl) && replacing?.imageUrl !== candidate.imageUrl)
      return;
    if (replacing) {
      onChange(
        value.map((slide) =>
          slide.id === replacing.id ? { ...candidate, id: slide.id } : slide,
        ),
      );
    } else if (value.length < MAX_LOGIN_SLIDES) {
      onChange([...value, { ...candidate, id: crypto.randomUUID() }]);
    }
    setOpen(false);
    setReplaceId(null);
  };
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const from = value.findIndex((slide) => slide.id === active.id);
    const to = value.findIndex((slide) => slide.id === over?.id);
    if (over && from >= 0 && to >= 0 && from !== to)
      onChange(arrayMove(value, from, to));
  };
  const replacing = value.find((slide) => slide.id === replaceId);

  return (
    <section className="login-slides-editor">
      <div className="hero-admin-panel-heading">
        <div>
          <h3>LOGIN SLIDES</h3>
          <p>카드를 드래그해 노출 순서를 바꿉니다.</p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={() =>
            showPicker(value.length >= MAX_LOGIN_SLIDES ? value[0]?.id ?? null : null)
          }
        >
          <ImagePlus aria-hidden="true" />
          {value.length >= MAX_LOGIN_SLIDES ? "첫 슬라이드 교체" : "이미지 추가"}
        </button>
      </div>
      <div className="login-slide-rail">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={value.map((slide) => slide.id)} strategy={rectSortingStrategy}>
          <div className="hero-slide-strip login-slide-strip">
            {value.map((slide, index) => (
              <LoginSlideCard
                key={slide.id}
                slide={slide}
                index={index}
                selected={replaceId === slide.id}
                onSelect={() => showPicker(slide.id)}
                onRemove={() => onChange(value.filter((item) => item.id !== slide.id))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      </div>

      {open && (
        <section className="hero-admin-panel hero-admin-catalog login-image-pool">
          <div className="hero-admin-panel-heading">
            <div>
              <h3>IMAGE POOL</h3>
              <p>
                {replacing
                  ? `“${replacing.title}” 슬라이드를 교체합니다.`
                  : "추가할 이미지를 고르세요."}
              </p>
            </div>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setOpen(false)}>
              닫기
            </button>
          </div>
          <div className="hero-admin-filters">
            <label className="hero-admin-search">
              <Search aria-hidden="true" />
              <span className="sr-only">이미지 검색</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="앨범, 아티스트, 장면 검색"
              />
            </label>
            <CustomSelect
              value={source}
              ariaLabel="이미지 출처 필터"
              onChange={(value) => setSource(value as "all" | LoginSlideSource)}
              options={[
                { value: "all", label: "모든 이미지" },
                { value: "album-cover", label: "앨범 커버" },
                { value: "album-hero", label: "앨범 히어로" },
                { value: "scene-hero", label: "장면 히어로" },
                { value: "member-gallery", label: "멤버 사진첩" },
              ]}
            />
          </div>
          {visibleCandidates.length ? (
            <div className="hero-admin-catalog-grid">
              {visibleCandidates.map((candidate) => {
                const disabled =
                  used.has(candidate.imageUrl) &&
                  replacing?.imageUrl !== candidate.imageUrl;
                return (
                  <article key={`${candidate.source}-${candidate.imageUrl}`} className="hero-admin-catalog-item">
                    <span className="hero-admin-catalog-cover">
                      <AdminAssetImage src={candidate.imageUrl} alt="" sizes="64px" />
                    </span>
                    <div>
                      <b>{candidate.title}</b>
                      <small>{sourceLabel[candidate.source]}</small>
                    </div>
                    <button type="button" disabled={disabled} onClick={() => choose(candidate)}>
                      <Plus aria-hidden="true" />
                      <span>{disabled ? "사용 중" : "선택"}</span>
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="hero-admin-empty is-compact">
              <ImagePlus aria-hidden="true" />
              <b>{candidates.length ? "검색 조건과 일치하는 이미지가 없습니다." : "공개된 이미지를 찾지 못했습니다."}</b>
              <span>앨범 커버·히어로, 장면 히어로, 멤버 사진첩에서 고를 수 있습니다.</span>
            </div>
          )}
        </section>
      )}
    </section>
  );
}
