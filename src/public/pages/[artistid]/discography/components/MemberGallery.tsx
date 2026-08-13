"use client";

import { memo, useMemo, useState } from "react";
import { useLocale } from "@/core/providers/LocaleContext";
import { MemberGalleryFilters } from "./MemberGalleryFilters";
import { MemberGalleryGrid } from "./MemberGalleryGrid";
import { MemberGalleryLightbox } from "./MemberGalleryLightbox";
import type {
  DiscographyAlbum,
  DiscographyGalleryItem,
  DiscographyMember,
} from "../lib/types";

interface MemberGalleryProps {
  album: DiscographyAlbum;
  members: DiscographyMember[];
  gallery: DiscographyGalleryItem[];
  albumColor: string;
  layout?: "panel" | "flow";
}

export const MemberGallery = memo(function MemberGallery({
  album,
  members,
  gallery,
  albumColor,
  layout = "panel",
}: MemberGalleryProps) {
  const { t } = useLocale();
  const [selectedMemberId, setSelectedMemberId] = useState("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const albumGallery = useMemo(
    () => gallery.filter((item) => !item.albumId || item.albumId === album.id),
    [album.id, gallery],
  );
  const filteredGallery = useMemo(
    () =>
      selectedMemberId === "all"
        ? albumGallery
        : albumGallery.filter((item) => item.memberId === selectedMemberId),
    [albumGallery, selectedMemberId],
  );
  const memberMap = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  );
  const photoCounts = useMemo(() => {
    const counts = new Map<string, number>();
    albumGallery.forEach(
      (item) =>
        item.memberId &&
        counts.set(item.memberId, (counts.get(item.memberId) || 0) + 1),
    );
    return counts;
  }, [albumGallery]);
  const selectedMember =
    selectedMemberId === "all" ? null : memberMap.get(selectedMemberId) || null;

  if (!members.length)
    return (
      <div
        className={
          layout === "panel"
            ? "h-full flex items-center justify-center p-6 text-center"
            : "min-h-[180px] flex items-center justify-center p-6 text-center"
        }
      >
        <p className="text-sm text-[var(--palette-6b7280)]">
          {t.discography.noMembers}
        </p>
      </div>
    );

  return (
    <div
      className={
        layout === "panel"
          ? "h-full overflow-hidden flex flex-col gap-3 animate-slideIn select-none"
          : "overflow-visible flex flex-col gap-3 animate-slideIn select-none"
      }
    >
      <MemberGalleryFilters
        albumColor={albumColor}
        selectedMemberId={selectedMemberId}
        selectedMember={selectedMember}
        members={members}
        photoCounts={photoCounts}
        totalPhotos={albumGallery.length}
        filteredPhotos={filteredGallery.length}
        onSelect={setSelectedMemberId}
      />
      <div
        className={
          layout === "panel"
            ? "flex-1 min-h-0 overflow-y-auto pr-1"
            : "overflow-visible"
        }
      >
        <MemberGalleryGrid
          album={album}
          albumColor={albumColor}
          gallery={filteredGallery}
          members={memberMap}
          showMember={selectedMemberId === "all"}
          onOpen={setLightboxIndex}
        />
      </div>
      {lightboxIndex !== null && (
        <MemberGalleryLightbox
          albumColor={albumColor}
          gallery={filteredGallery}
          members={memberMap}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
});
