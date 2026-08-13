import Image from "next/image";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { DiscographyGalleryItem, DiscographyMember } from "../lib/types";

type Props = {
  albumColor: string;
  gallery: DiscographyGalleryItem[];
  members: Map<string, DiscographyMember>;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

export function MemberGalleryLightbox({
  albumColor,
  gallery,
  members,
  index,
  onIndexChange,
  onClose,
}: Props) {
  const photo = gallery[index];
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousActiveElement = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => {
      cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      if (previousActiveElement?.isConnected) {
        requestAnimationFrame(() => previousActiveElement.focus());
      }
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && index > 0) onIndexChange(index - 1);
      if (event.key === "ArrowRight" && index < gallery.length - 1)
        onIndexChange(index + 1);
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          "button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
        ) ?? [],
      );
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [gallery.length, index, onClose, onIndexChange]);

  if (!photo) return null;
  const member = photo.memberId ? members.get(photo.memberId) : null;
  return createPortal(
    <div
      ref={dialogRef}
      style={{ position: "fixed", inset: 0, zIndex: 9999 }}
      className="flex items-center justify-center bg-[var(--alpha-000000-92)] backdrop-blur-xl animate-fadeIn select-none overflow-hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={photo.caption || "Gallery image"}
      tabIndex={-1}
    >
      <button
        ref={closeButtonRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        style={{
          position: "fixed",
          top: "1.25rem",
          right: "1.25rem",
          zIndex: 10000,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          borderColor: `${albumColor}60`,
          boxShadow: `0 0 20px ${albumColor}30`,
        }}
        className="p-3 rounded-full text-white backdrop-blur-md border transition-all duration-200 hover:scale-110 active:scale-95 shadow-2xl cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-pink)] motion-reduce:transform-none motion-reduce:transition-none"
        aria-label="Close Lightbox"
      >
        <X className="w-6 h-6" />
      </button>
      <div
        className="relative w-full h-full flex flex-col items-center justify-center px-6 sm:px-12 py-16 sm:py-14"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="relative w-full flex-1 min-h-0 rounded-2xl overflow-hidden shadow-2xl border"
          style={{
            borderColor: `${albumColor}40`,
            boxShadow: `0 0 60px ${albumColor}25, 0 20px 40px rgba(0,0,0,0.6)`,
          }}
        >
          <Image
            src={photo.imageUrl}
            alt={photo.caption || ""}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 90vw"
            priority
          />
        </div>
        <div className="w-full flex items-center justify-between mt-3 px-1 text-[var(--color-static-white)] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {member && (
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-black text-black shrink-0 shadow-md"
                style={{ backgroundColor: albumColor }}
              >
                {member.name}
              </span>
            )}
            {photo.caption && (
              <span className="text-xs sm:text-sm font-medium text-[var(--palette-e5e7eb)] truncate max-w-[220px] sm:max-w-[500px]">
                {photo.caption}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-mono text-[var(--palette-9ca3af)]">
              {index + 1} / {gallery.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => onIndexChange(index - 1)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-static-white)] border border-[var(--alpha-ffffff-1)] hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-pink)] motion-reduce:transform-none motion-reduce:transition-none"
                style={{ backgroundColor: `${albumColor}25` }}
                aria-label="Previous image"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={index === gallery.length - 1}
                onClick={() => onIndexChange(index + 1)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-static-white)] border border-[var(--alpha-ffffff-1)] hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-pink)] motion-reduce:transform-none motion-reduce:transition-none"
                style={{ backgroundColor: `${albumColor}25` }}
                aria-label="Next image"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
