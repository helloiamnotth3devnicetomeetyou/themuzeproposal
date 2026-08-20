"use client";

import { useEffect, useState } from "react";
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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import AdminAssetImage from "@/admin/components/assets/AdminAssetImage";
import {
  MAX_LOGIN_SLIDES,
  type LoginSlide,
  type LoginSlideSource,
} from "@/core/content/login-slides";
import { supabase } from "@/core/supabase/client";

type Candidate = Omit<LoginSlide, "id">;

const sourceLabel: Record<LoginSlideSource, string> = {
  legacy: "기존 슬라이드",
  "album-cover": "앨범 커버",
  "scene-hero": "장면 히어로",
  "member-gallery": "멤버 사진첩",
};

function SortableSlide({ slide, onRemove }: { slide: LoginSlide; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: slide.id });
  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center gap-3 rounded border border-white/10 bg-black/20 p-2"
    >
      <button type="button" className="cursor-grab text-white/60" aria-label="슬라이드 순서 변경" {...attributes} {...listeners}>
        <GripVertical aria-hidden="true" />
      </button>
      <AdminAssetImage src={slide.imageUrl} alt="" width={96} height={64} sizes="96px" className="h-16 w-24 rounded object-cover" />
      <div className="min-w-0 flex-1">
        <b className="block truncate text-sm">{slide.title}</b>
        <small className="text-white/55">{sourceLabel[slide.source]}</small>
      </div>
      <button type="button" className="is-danger" aria-label={`${slide.title} 삭제`} onClick={onRemove}>
        <Trash2 aria-hidden="true" />
      </button>
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
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    let active = true;
    async function load() {
      const [albums, scenes, gallery] = await Promise.all([
        supabase.from("albums").select("id,title,cover_url,is_published,published_at,artist:artists!inner(name,is_active)").eq("is_published", true).not("cover_url", "is", null),
        supabase.from("artist_scenes").select("id,title,image_url,is_hero,is_published,artist:artists!inner(name,is_active)").eq("is_hero", true).eq("is_published", true),
        supabase.from("artist_gallery").select("id,caption,image_url,member_id,is_published,artist:artists!inner(name,is_active)").not("member_id", "is", null).eq("is_published", true),
      ]);
      if (!active) return;
      const published = (item: { artist?: Array<{ is_active?: boolean }> | null }) =>
        item.artist?.[0]?.is_active;
      const next: Candidate[] = [
        ...((albums.data ?? []) as unknown as Array<{ id: string; title: string; cover_url: string | null; artist: Array<{ name: string; is_active: boolean }> | null }>)
          .filter((item) => item.cover_url && published(item))
          .map((item) => ({ imageUrl: item.cover_url!, title: `${item.artist?.[0]?.name ?? ""} · ${item.title}`, source: "album-cover" as const })),
        ...((scenes.data ?? []) as unknown as Array<{ id: string; title: string; image_url: string; artist: Array<{ name: string; is_active: boolean }> | null }>)
          .filter(published)
          .map((item) => ({ imageUrl: item.image_url, title: `${item.artist?.[0]?.name ?? ""} · ${item.title || "Hero"}`, source: "scene-hero" as const })),
        ...((gallery.data ?? []) as unknown as Array<{ id: string; caption: string; image_url: string; artist: Array<{ name: string; is_active: boolean }> | null }>)
          .filter(published)
          .map((item) => ({ imageUrl: item.image_url, title: `${item.artist?.[0]?.name ?? ""} · ${item.caption || "Gallery"}`, source: "member-gallery" as const })),
      ];
      setCandidates(next);
    }
    void load();
    return () => { active = false; };
  }, []);

  const selected = new Set(value.map((slide) => slide.imageUrl));
  const add = (candidate: Candidate) => {
    if (value.length >= MAX_LOGIN_SLIDES || selected.has(candidate.imageUrl)) return;
    onChange([...value, { ...candidate, id: crypto.randomUUID() }]);
    setOpen(false);
  };
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = value.findIndex((slide) => slide.id === active.id);
    const to = value.findIndex((slide) => slide.id === over.id);
    if (from >= 0 && to >= 0) onChange(arrayMove(value, from, to));
  };

  return (
    <section className="settings-panel space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div><h3>LOGIN SLIDES</h3><p className="text-sm text-white/60">공개된 앨범 커버, 장면 히어로, 멤버 사진첩에서 고릅니다.</p></div>
        <button type="button" className="admin-btn admin-btn-secondary" disabled={value.length >= MAX_LOGIN_SLIDES} onClick={() => setOpen((current) => !current)}><Plus aria-hidden="true" /> 이미지 추가</button>
      </div>
      <p className="text-sm text-white/60">{value.length} / {MAX_LOGIN_SLIDES}장 · 같은 이미지는 한 번만 사용할 수 있습니다.</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={value.map((slide) => slide.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {value.map((slide) => <SortableSlide key={slide.id} slide={slide} onRemove={() => onChange(value.filter((item) => item.id !== slide.id))} />)}
          </div>
        </SortableContext>
      </DndContext>
      {open && (
        <div className="grid gap-2 sm:grid-cols-2">
          {candidates.map((candidate) => {
            const unavailable = selected.has(candidate.imageUrl) || value.length >= MAX_LOGIN_SLIDES;
            return <button key={`${candidate.source}-${candidate.imageUrl}`} type="button" disabled={unavailable} onClick={() => add(candidate)} className="flex items-center gap-3 rounded border border-white/10 p-2 text-left disabled:opacity-40">
              <AdminAssetImage src={candidate.imageUrl} alt="" width={96} height={64} sizes="96px" className="h-16 w-24 rounded object-cover" />
              <span className="min-w-0"><b className="block truncate text-sm">{candidate.title}</b><small className="text-white/55">{sourceLabel[candidate.source]}</small></span>
            </button>;
          })}
        </div>
      )}
    </section>
  );
}
