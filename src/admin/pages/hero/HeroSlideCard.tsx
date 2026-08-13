"use client";

import { type CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, GripVertical, Trash2 } from "lucide-react";
import AdminAssetImage from "@/admin/components/assets/AdminAssetImage";
import HeroVideoClipEditor from "./HeroVideoClipEditor";

export type HeroArtist = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
};

export type HeroAlbum = {
  id: string;
  artist_id: string;
  title: string;
  type: string;
  cover_url: string | null;
  hero_image_url: string | null;
  color: string | null;
  release_date: string | null;
  is_published: boolean;
  published_at: string | null;
};

export type HeroSlide = {
  id: string;
  album_id: string;
  sort_order: number;
  is_active: boolean;
  video_url: string | null;
};

type SlideCardProps = {
  slide: HeroSlide;
  index: number;
  album?: HeroAlbum;
  artist?: HeroArtist;
  live: boolean;
  accent: string;
  disabled: boolean;
  onRemove: () => void;
  onVideoChange: (videoUrl: string | null) => Promise<void>;
  onVideoStatus: (message: string | null) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
};

export function SortableSlideCard({
  slide,
  index,
  album,
  artist,
  live,
  accent,
  disabled,
  onRemove,
  onVideoChange,
  onVideoStatus,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: SlideCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: slide.id,
    disabled,
    transition: { duration: 240, easing: "cubic-bezier(.22,.8,.24,1)" },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    "--album-color": accent,
  } as CSSProperties;

  return (
    <article
      ref={setNodeRef}
      style={style}
      data-tour-id="hero-reorder"
      className={`hero-slide-card ${isDragging ? "is-dragging" : ""} ${isOver ? "is-over" : ""}`}
    >
      <div className="hero-slide-frame">
        {album?.hero_image_url || album?.cover_url ? (
          <AdminAssetImage
            src={album.hero_image_url || album.cover_url || ""}
            alt=""
            sizes="420px"
          />
        ) : (
          <i className="hero-slide-placeholder" />
        )}
        <span className="hero-slide-shade" />
        <span className="hero-slide-position">
          <small>SLIDE</small>
          <b>{String(index + 1).padStart(2, "0")}</b>
        </span>
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="hero-slide-grab"
          disabled={disabled}
          title="끌어서 순서 변경"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" />
          <span>끌어서 이동</span>
        </button>
        {!live && <span className="hero-slide-unavailable">앨범 비공개</span>}
        <div className="hero-slide-copy">
          <small>
            {artist?.name || "앨범 정보 없음"} · {album?.type || "-"}
          </small>
          <b>{album?.title || "삭제된 앨범"}</b>
        </div>
      </div>
      <HeroVideoClipEditor
        slideId={slide.id}
        videoUrl={slide.video_url}
        disabled={disabled}
        onChange={onVideoChange}
        onStatus={onVideoStatus}
      />
      <footer className="hero-slide-footer">
        <span>드래그해 노출 순서 변경</span>
        <div>
          <button
            type="button"
            aria-label="위로 이동"
            disabled={disabled || !canMoveUp}
            onClick={onMoveUp}
          >
            <ChevronUp aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="아래로 이동"
            disabled={disabled || !canMoveDown}
            onClick={onMoveDown}
          >
            <ChevronDown aria-hidden="true" />
          </button>
          <button
            type="button"
            data-tour-id="hero-remove"
            className="is-danger"
            aria-label="목록에서 제외"
            title="목록에서 제외"
            disabled={disabled}
            onClick={onRemove}
          >
            <Trash2 />
          </button>
        </div>
      </footer>
    </article>
  );
}

export function SlideDragOverlay({
  index,
  album,
  artist,
  accent,
  videoUrl,
}: Pick<SlideCardProps, "index" | "album" | "artist" | "accent"> & {
  videoUrl: string | null;
}) {
  return (
    <article
      className="hero-slide-card is-overlay"
      style={{ "--album-color": accent } as CSSProperties}
    >
      <div className="hero-slide-frame">
        {album?.hero_image_url || album?.cover_url ? (
          <AdminAssetImage
            src={album.hero_image_url || album.cover_url || ""}
            alt=""
            sizes="420px"
          />
        ) : (
          <i className="hero-slide-placeholder" />
        )}
        <span className="hero-slide-shade" />
        <span className="hero-slide-position">
          <small>SLIDE</small>
          <b>{String(index + 1).padStart(2, "0")}</b>
        </span>
        <span className="hero-slide-grab is-overlay-handle">
          <GripVertical aria-hidden="true" />
          <span>이동 중</span>
        </span>
        <div className="hero-slide-copy">
          <small>
            {artist?.name || "앨범 정보 없음"} · {album?.type || "-"}
          </small>
          <b>{album?.title || "삭제된 앨범"}</b>
        </div>
      </div>
      <div className="hero-video-summary" aria-hidden="true">
        <div>
          <b>히어로 영상</b>
          <span>{videoUrl ? "12초 FHD MP4 저장됨" : "등록된 영상 없음"}</span>
        </div>
        <span className="hero-video-open">영상 편집</span>
      </div>
      <footer className="hero-slide-footer" aria-hidden="true">
        <span>드래그해 노출 순서 변경</span>
        <div>
          <span>
            <ChevronUp />
          </span>
          <span>
            <ChevronDown />
          </span>
          <span>
            <Trash2 />
          </span>
        </div>
      </footer>
    </article>
  );
}
