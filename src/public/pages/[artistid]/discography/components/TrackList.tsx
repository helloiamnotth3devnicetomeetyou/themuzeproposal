import type { DiscographyAlbum } from "../lib/types";
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
      className={`flex flex-col gap-1 pr-1 ${layout === "panel" ? "flex-1 min-h-0 overflow-y-auto scrollbar-none" : "overflow-visible"}`}
    >
      {album.tracks.map((track, index) => {
        const isActive = currentTrackIndex === index;
        const isHovered = hoveredDisc === index;
        const spotifyHref = safeHref(track.spotifyUrl);
        const videoHref = safeHref(track.videoUrl);

        return (
          <div
            key={track.title}
            className="flex items-center rounded-xl group/track relative shrink-0 pr-2"
            style={{
              backgroundColor: isActive
                ? "var(--alpha-ffffff-06)"
                : isHovered
                  ? "var(--alpha-ffffff-04)"
                  : undefined,
              border: `1px solid ${
                isActive
                  ? `${album.color}50`
                  : isHovered
                    ? `${album.color}40`
                    : "transparent"
              }`,
              boxShadow:
                isHovered && !isActive
                  ? `0 0 15px ${album.color}20`
                  : undefined,
              transition: "all var(--duration-base) ease",
            }}
          >
            <button
              type="button"
              onClick={() => onPlayTrack(index)}
              className="flex flex-1 items-center gap-3 min-w-0 p-2.5 text-left cursor-pointer"
            >
              <span
                className="text-[10px] shrink-0 transition-colors duration-base"
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
                className={`text-sm font-semibold truncate transition-colors duration-base ${
                  isActive || isHovered
                    ? "text-[var(--color-static-white)]"
                    : "text-[var(--palette-6b7280)] group-hover/track:text-[var(--palette-d1d5db)]"
                }`}
              >
                {track.title}
              </span>
              {track.isTitle && (
                <span
                  className="text-[7px] font-black tracking-wider px-1.5 py-0.5 rounded"
                  style={{
                    color: album.color,
                    border: `1px solid ${album.color}45`,
                  }}
                >
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
                  className="text-[8px] font-bold text-[var(--palette-6b7280)] hover:text-[var(--color-static-white)] px-1.5 py-1"
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
                  className="text-[8px] font-bold text-[var(--palette-6b7280)] hover:text-[var(--color-static-white)] px-1.5 py-1"
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
