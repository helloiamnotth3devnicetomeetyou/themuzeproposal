"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { LuChevronLeft, LuChevronRight, LuImage, LuMaximize2, LuX } from "react-icons/lu";
import { useLocale } from "@/core/providers/LocaleContext";

import type { DiscographyAlbum, DiscographyGalleryItem, DiscographyMember } from "../lib/types";

interface MemberGalleryProps {
  album: DiscographyAlbum;
  members: DiscographyMember[];
  gallery: DiscographyGalleryItem[];
  albumColor: string;
}

/**
 * Returns a deterministic grid span class (1x1, 1x2, 2x1, 2x2) for bento collage layout.
 */
function getBentoSpanClass(index: number, total: number): string {
  if (total === 1) return "col-span-2 row-span-2";
  if (total === 2) return index === 0 ? "col-span-2 row-span-2" : "col-span-1 row-span-2";

  const mod = index % 8;
  switch (mod) {
    case 0:
      return "col-span-2 row-span-2"; // Featured Large (2x2)
    case 1:
      return "col-span-1 row-span-2"; // Tall Vertical (1x2)
    case 2:
      return "col-span-2 row-span-1"; // Wide Landscape (2x1)
    case 3:
      return "col-span-1 row-span-1"; // Square (1x1)
    case 4:
      return "col-span-1 row-span-2"; // Tall Vertical (1x2)
    case 5:
      return "col-span-2 row-span-1"; // Wide Landscape (2x1)
    case 6:
      return "col-span-1 row-span-1"; // Square (1x1)
    default:
      return "col-span-1 row-span-1"; // Square (1x1)
  }
}

export function MemberGallery({
  album,
  members,
  gallery,
  albumColor,
}: MemberGalleryProps) {
  const { t } = useLocale();
  const [selectedMemberId, setSelectedMemberId] = useState<string>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Filter gallery items belonging to current album
  const albumGallery = useMemo(() => {
    return gallery.filter((item) => !item.albumId || item.albumId === album.id);
  }, [album.id, gallery]);

  // Filtered gallery items for selected member
  const filteredGallery = useMemo(() => {
    if (selectedMemberId === "all") return albumGallery;
    return albumGallery.filter((item) => item.memberId === selectedMemberId);
  }, [albumGallery, selectedMemberId]);

  // Map memberId -> DiscographyMember for quick lookup
  const memberMap = useMemo(() => {
    const map = new Map<string, DiscographyMember>();
    members.forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  const selectedMember = selectedMemberId !== "all" ? memberMap.get(selectedMemberId) : null;

  // Photo count per member for the current album
  const photoCounts = useMemo(() => {
    const counts = new Map<string, number>();
    albumGallery.forEach((item) => {
      if (item.memberId) {
        counts.set(item.memberId, (counts.get(item.memberId) || 0) + 1);
      }
    });
    return counts;
  }, [albumGallery]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
      }
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) =>
          prev !== null && prev < filteredGallery.length - 1 ? prev + 1 : prev,
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, filteredGallery.length]);

  if (members.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <p className="text-sm text-[var(--palette-6b7280)]">{t.discography.noMembers}</p>
      </div>
    );
  }

  const activePhoto = lightboxIndex !== null ? filteredGallery[lightboxIndex] : null;

  return (
    <div className="h-full flex flex-col gap-3 animate-slideIn select-none overflow-hidden">
      {/* Member Filter Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none shrink-0">
        <button
          onClick={() => setSelectedMemberId("all")}
          className="px-3 py-1.2 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1.5 shrink-0 border"
          style={{
            borderColor: selectedMemberId === "all" ? albumColor : "var(--alpha-ffffff-1)",
            backgroundColor: selectedMemberId === "all" ? `${albumColor}28` : "var(--alpha-ffffff-03)",
            color: selectedMemberId === "all" ? "var(--color-static-white)" : "var(--palette-9ca3af)",
            boxShadow: selectedMemberId === "all" ? `0 0 14px ${albumColor}35` : "none",
          }}
        >
          <LuImage className="w-3.5 h-3.5" style={{ color: selectedMemberId === "all" ? albumColor : "inherit" }} />
          <span>{t.discography.allMembers}</span>
          <span
            className="text-[10px] px-1.5 py-0.2 rounded-full font-extrabold"
            style={{
              backgroundColor: selectedMemberId === "all" ? albumColor : "var(--alpha-ffffff-1)",
              color: selectedMemberId === "all" ? "#000" : "var(--palette-9ca3af)",
            }}
          >
            {albumGallery.length}
          </span>
        </button>

        {members.map((member) => {
          const count = photoCounts.get(member.id) || 0;
          const isSelected = selectedMemberId === member.id;

          return (
            <button
              key={member.id}
              onClick={() => setSelectedMemberId(member.id)}
              className="px-3 py-1.2 rounded-full text-xs font-semibold transition-all duration-300 flex items-center gap-2 shrink-0 border"
              style={{
                borderColor: isSelected ? albumColor : "var(--alpha-ffffff-1)",
                backgroundColor: isSelected ? `${albumColor}28` : "var(--alpha-ffffff-03)",
                color: isSelected ? "var(--color-static-white)" : "var(--palette-9ca3af)",
                boxShadow: isSelected ? `0 0 14px ${albumColor}35` : "none",
              }}
            >
              {member.imageUrl ? (
                <div
                  className="w-4.5 h-4.5 rounded-full overflow-hidden relative shrink-0 border"
                  style={{ borderColor: isSelected ? albumColor : member.color || albumColor }}
                >
                  <Image
                    src={member.imageUrl}
                    alt={member.name}
                    fill
                    className="object-cover"
                    sizes="18px"
                  />
                </div>
              ) : (
                <div
                  className="w-4.5 h-4.5 rounded-full flex items-center justify-center text-[8px] font-black shrink-0"
                  style={{ backgroundColor: member.color || albumColor, color: "#000" }}
                >
                  {member.name.slice(0, 1)}
                </div>
              )}
              <span className="truncate max-w-[90px]">{member.name}</span>
              {count > 0 && (
                <span
                  className="text-[9px] px-1.5 py-0.2 rounded-full font-bold"
                  style={{
                    backgroundColor: isSelected ? albumColor : "var(--alpha-ffffff-1)",
                    color: isSelected ? "#000" : "var(--palette-9ca3af)",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Member Context Header */}
      {selectedMember && (
        <div
          className="px-3.5 py-2 rounded-xl flex items-center justify-between shrink-0 border backdrop-blur-md"
          style={{
            backgroundColor: `${albumColor}12`,
            borderColor: `${albumColor}30`,
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {selectedMember.imageUrl ? (
              <div
                className="w-7 h-7 rounded-full overflow-hidden relative border-2 shrink-0"
                style={{ borderColor: albumColor }}
              >
                <Image
                  src={selectedMember.imageUrl}
                  alt={selectedMember.name}
                  fill
                  className="object-cover"
                  sizes="28px"
                />
              </div>
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shrink-0"
                style={{ backgroundColor: albumColor, color: "#000" }}
              >
                {selectedMember.name.slice(0, 1)}
              </div>
            )}
            <div className="min-w-0 flex items-center gap-2">
              <h4 className="text-xs font-bold text-[var(--color-static-white)] truncate">
                {selectedMember.name}
              </h4>
              <span
                className="text-[8px] px-1.5 py-0.2 rounded-md font-bold uppercase tracking-wider text-black"
                style={{ backgroundColor: albumColor }}
              >
                {selectedMember.role || "MEMBER"}
              </span>
            </div>
          </div>
          <span className="text-[10px] text-[var(--palette-9ca3af)] font-mono">
            {filteredGallery.length} {t.discography.photoCount}
          </span>
        </div>
      )}

      {/* Seamless Bento Collage Grid (Slightly Reduced Image Tile Sizes) */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {filteredGallery.length === 0 ? (
          <div
            className="h-full min-h-[180px] rounded-2xl flex flex-col items-center justify-center p-6 text-center border"
            style={{
              backgroundColor: `${albumColor}08`,
              borderColor: `${albumColor}18`,
            }}
          >
            <LuImage className="w-9 h-9 mb-2 opacity-40" style={{ color: albumColor }} />
            <p className="text-xs text-[var(--palette-9ca3af)]">{t.discography.noPhotos}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 auto-rows-[75px] sm:auto-rows-[90px] md:auto-rows-[100px] gap-2 grid-flow-dense pb-4">
            {filteredGallery.map((item, index) => {
              const member = item.memberId ? memberMap.get(item.memberId) : null;
              const spanClass = getBentoSpanClass(index, filteredGallery.length);

              return (
                <div
                  key={item.id}
                  onClick={() => setLightboxIndex(index)}
                  className={`group relative rounded-xl overflow-hidden cursor-pointer border transition-all duration-300 hover:z-20 hover:scale-[1.03] ${spanClass}`}
                  style={{
                    backgroundColor: `${albumColor}10`,
                    borderColor: `${albumColor}25`,
                  }}
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.caption || album.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                  />

                  {/* Inner Border Glow on Hover */}
                  <div
                    className="absolute inset-0 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100 pointer-events-none"
                    style={{
                      boxShadow: `inset 0 0 0 2px ${albumColor}, 0 6px 20px ${albumColor}35`,
                    }}
                  />

                  {/* Overlay for Member Tag & Caption */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--alpha-000000-85)] via-[var(--alpha-000000-2)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-2">
                    <div className="flex justify-between items-start">
                      {selectedMemberId === "all" && member ? (
                        <span
                          className="px-1.5 py-0.2 rounded-full text-[8px] font-bold text-black shadow-md backdrop-blur-sm"
                          style={{ backgroundColor: albumColor }}
                        >
                          {member.name}
                        </span>
                      ) : (
                        <span />
                      )}

                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center backdrop-blur-md text-[var(--color-static-white)]"
                        style={{ backgroundColor: `${albumColor}50` }}
                      >
                        <LuMaximize2 className="w-2.5 h-2.5" />
                      </div>
                    </div>

                    {item.caption && (
                      <p className="text-[10px] text-[var(--color-static-white)] font-medium truncate drop-shadow-md">
                        {item.caption}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox — rendered via Portal directly into document.body to escape parent stacking context */}
      {activePhoto && lightboxIndex !== null &&
        createPortal(
          <div
            style={{ position: "fixed", inset: 0, zIndex: 9999 }}
            className="flex items-center justify-center bg-[var(--alpha-000000-92)] backdrop-blur-xl animate-fadeIn select-none overflow-hidden"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Close Button — always top-right of true viewport */}
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
              style={{
                position: "fixed",
                top: "1.25rem",
                right: "1.25rem",
                zIndex: 10000,
                backgroundColor: "rgba(0, 0, 0, 0.75)",
                borderColor: `${albumColor}60`,
                boxShadow: `0 0 20px ${albumColor}30`,
              }}
              className="p-3 rounded-full text-white backdrop-blur-md border transition-all duration-200 hover:scale-110 active:scale-95 shadow-2xl cursor-pointer"
              aria-label="Close Lightbox"
            >
              <LuX className="w-6 h-6" />
            </button>

            {/* Inner layout — clicks on this area do NOT close */}
            <div
              className="relative w-full h-full flex flex-col items-center justify-center px-6 sm:px-12 py-16 sm:py-14"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image Area — fills remaining height */}
              <div
                className="relative w-full flex-1 min-h-0 rounded-2xl overflow-hidden shadow-2xl border"
                style={{
                  borderColor: `${albumColor}40`,
                  boxShadow: `0 0 60px ${albumColor}25, 0 20px 40px rgba(0,0,0,0.6)`,
                }}
              >
                <Image
                  src={activePhoto.imageUrl}
                  alt={activePhoto.caption || ""}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 90vw"
                  priority
                />
              </div>

              {/* Footer: member badge + caption + prev/next */}
              <div className="w-full flex items-center justify-between mt-3 px-1 text-[var(--color-static-white)] shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  {activePhoto.memberId && memberMap.get(activePhoto.memberId) && (
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-black text-black shrink-0 shadow-md"
                      style={{ backgroundColor: albumColor }}
                    >
                      {memberMap.get(activePhoto.memberId)?.name}
                    </span>
                  )}
                  {activePhoto.caption && (
                    <span className="text-xs sm:text-sm font-medium text-[var(--palette-e5e7eb)] truncate max-w-[220px] sm:max-w-[500px]">
                      {activePhoto.caption}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono text-[var(--palette-9ca3af)]">
                    {lightboxIndex + 1} / {filteredGallery.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={lightboxIndex === 0}
                      onClick={() => setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-static-white)] border border-[var(--alpha-ffffff-1)] hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 transition-all cursor-pointer"
                      style={{ backgroundColor: `${albumColor}25` }}
                      aria-label="Previous image"
                    >
                      <LuChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      disabled={lightboxIndex === filteredGallery.length - 1}
                      onClick={() => setLightboxIndex((prev) => (prev !== null && prev < filteredGallery.length - 1 ? prev + 1 : prev))}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-static-white)] border border-[var(--alpha-ffffff-1)] hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 transition-all cursor-pointer"
                      style={{ backgroundColor: `${albumColor}25` }}
                      aria-label="Next image"
                    >
                      <LuChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      }
    </div>
  );
}
