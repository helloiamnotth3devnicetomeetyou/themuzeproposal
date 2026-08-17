import type { DiscographyAlbum } from "@/public/features/discography/types";
import { useLocale } from "@/core/providers/LocaleContext";
import { safeHref } from "@/core/http/safe-href";
import { memo } from "react";

interface TrackListProps {
  album: DiscographyAlbum;
  currentTrackIndex: number;
  hoveredDisc: number | null;
  isPlaying: boolean;
  layout?: "panel" | "flow";
  onPlayTrack: (index: number) => void;
}

export const TrackList = memo(function TrackList({
  album,
  currentTrackIndex,
  hoveredDisc,
  isPlaying,
  layout = "panel",
  onPlayTrack,
}: TrackListProps) {
  const { t } = useLocale();
  return (
    <div
      className={`flex flex-col divide-y divide-[var(--alpha-ffffff-08)] pr-1 ${layout === "panel" ? "flex-1 min-h-0 overflow-y-auto scrollbar-none" : "overflow-visible"}`}
    >
      {album.tracks.map((track, index) => {
        const isActive = currentTrackIndex === index;
        const isHovered = hoveredDisc === index;
        const spotifyHref = safeHref(track.spotifyUrl);
        const videoHref = safeHref(track.videoUrl);

        return (
          <div
            key={track.id}
            className="group/track relative flex shrink-0 items-center pr-2"
            style={{
              backgroundColor: isActive
                ? "color-mix(in srgb, var(--alpha-ffffff-06) 68%, transparent)"
                : isHovered
                  ? "var(--alpha-ffffff-025)"
                  : undefined,
              boxShadow: isActive ? `inset 2px 0 ${album.color}` : undefined,
              transition: "background-color var(--duration-base) ease",
            }}
          >
            <button
              type="button"
              onClick={() => onPlayTrack(index)}
              className="flex min-w-0 flex-1 items-center gap-4 py-4 pl-3 text-left"
            >
              <span
                className="shrink-0 font-display text-[10px] tabular-nums transition-colors duration-base"
                style={{
                  color:
                    isActive || isHovered
                      ? album.color
                      : "var(--palette-4b5563)",
                }}
              >
                {(index + 1).toString().padStart(2, "0")}
              </span>
              <span
                className={`truncate font-display text-[15px] font-medium tracking-[-0.01em] transition-colors duration-base ${
                  isActive || isHovered
                    ? "text-[var(--color-static-white)]"
                    : "text-[var(--palette-6b7280)] group-hover/track:text-[var(--palette-d1d5db)]"
                }`}
              >
                {track.title}
              </span>
              {track.isTitle && (
                <span className="shrink-0 font-display text-[9px] font-medium tracking-[0.08em] text-[var(--palette-9ca3af)]">
                  TITLE
                </span>
              )}
            </button>
            <div className="flex items-center gap-1.5 shrink-0">
              {spotifyHref && (
                <a
                  href={spotifyHref}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${track.title} Spotify`}
                  className="px-1.5 py-1 font-display text-[9px] font-medium tracking-[0.08em] text-[var(--palette-6b7280)] hover:text-[var(--color-static-white)]"
                >
                  SP
                </a>
              )}
              {videoHref && (
                <a
                  href={videoHref}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${track.title} ${t.discography.musicVideo}`}
                  className="px-1.5 py-1 font-display text-[9px] font-medium tracking-[0.08em] text-[var(--palette-6b7280)] hover:text-[var(--color-static-white)]"
                >
                  MV
                </a>
              )}
            </div>
            {isActive && isPlaying && (
              <div className="flex gap-[2px] items-end h-3 shrink-0">
                <span
                  className="w-[3px] h-[5px] rounded-full animate-bounce"
                  style={{
                    backgroundColor: album.color,
                    animationDelay: "0s",
                  }}
                />
                <span
                  className="w-[3px] h-[10px] rounded-full animate-bounce"
                  style={{
                    backgroundColor: album.color,
                    animationDelay: "0.15s",
                  }}
                />
                <span
                  className="w-[3px] h-[7px] rounded-full animate-bounce"
                  style={{
                    backgroundColor: album.color,
                    animationDelay: "0.3s",
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
