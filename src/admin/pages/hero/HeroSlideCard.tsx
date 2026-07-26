"use client";

import { type CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LuGripVertical, LuTrash2 } from "react-icons/lu";
import AdminAssetImage from "@/admin/components/assets/AdminAssetImage";

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
    <article ref={setNodeRef} style={style} className={`hero-slide-card ${isDragging ? "is-dragging" : ""} ${isOver ? "is-over" : ""}`}>
      <div className="hero-slide-frame">
        {album?.hero_image_url || album?.cover_url ? <AdminAssetImage src={album.hero_image_url || album.cover_url || ""} alt="" sizes="420px" /> : <i className="hero-slide-placeholder" />}
        <span className="hero-slide-shade" />
        <span className="hero-slide-position"><small>SLIDE</small><b>{String(index + 1).padStart(2, "0")}</b></span>
        <button ref={setActivatorNodeRef} type="button" className="hero-slide-grab" disabled={disabled} title="끌어서 순서 변경" {...attributes} {...listeners}><LuGripVertical aria-hidden="true" /><span>끌어서 이동</span></button>
        {!live && <span className="hero-slide-unavailable">앨범 비공개</span>}
        <div className="hero-slide-copy"><small>{artist?.name || "앨범 정보 없음"} · {album?.type || "-"}</small><b>{album?.title || "삭제된 앨범"}</b></div>
      </div>
      <footer className="hero-slide-footer">
        <span>드래그해 노출 순서 변경</span>
        <div>
          <button type="button" className="is-danger" aria-label="목록에서 제외" title="목록에서 제외" disabled={disabled} onClick={onRemove}><LuTrash2 /></button>
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
}: Pick<SlideCardProps, "index" | "album" | "artist" | "accent">) {
  return (
    <article className="hero-slide-card is-overlay" style={{ "--album-color": accent } as CSSProperties}>
      <div className="hero-slide-frame">
        {album?.hero_image_url || album?.cover_url ? <AdminAssetImage src={album.hero_image_url || album.cover_url || ""} alt="" sizes="420px" /> : <i className="hero-slide-placeholder" />}
        <span className="hero-slide-shade" />
        <span className="hero-slide-position"><small>SLIDE</small><b>{String(index + 1).padStart(2, "0")}</b></span>
        <span className="hero-slide-grab is-overlay-handle"><LuGripVertical aria-hidden="true" /><span>이동 중</span></span>
        <div className="hero-slide-copy"><small>{artist?.name || "앨범 정보 없음"} · {album?.type || "-"}</small><b>{album?.title || "삭제된 앨범"}</b></div>
      </div>
    </article>
  );
}
