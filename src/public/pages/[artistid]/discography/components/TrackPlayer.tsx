import { ChevronLeft, ChevronRight, CirclePlay, Pause, Play } from "lucide-react";
import { useLocale } from "@/core/providers/LocaleContext";
import { safeHref } from "@/core/http/safe-href";

import type { DiscographyTrack } from "../lib/types";

interface TrackPlayerProps {
  albumColor: string;
  isPlaying: boolean;
  time: {
    current: string;
    total: string;
  };
  track?: DiscographyTrack;
  onNext: () => void;
  onPrevious: () => void;
  onTogglePlay: () => void;
}

export function TrackPlayer({
  albumColor,
  isPlaying,
  time,
  track,
  onNext,
  onPrevious,
  onTogglePlay,
}: TrackPlayerProps) {
  const { t } = useLocale();
  const audioHref = safeHref(track?.audioUrl);
  const youtubeHref = safeHref(track?.youtubeUrl);
  return (
    <div
      className="p-5 sm:p-4 rounded-2xl flex flex-col gap-4 sm:gap-3 shrink-0"
      style={{
        backgroundColor: "var(--alpha-ffffff-025)",
        border: "1px solid var(--alpha-ffffff-05)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <span className="text-[8px] text-[var(--palette-4b5563)] font-black tracking-[0.15em] block">
            {t.discography.nowPlaying}
          </span>
          <span className="text-base font-bold text-[var(--color-static-white)] block truncate mt-0.5">
            {track?.title}
          </span>
        </div>
        <span className="text-[10px] text-[var(--palette-6b7280)] shrink-0">
          {time.current} / {time.total}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center py-1 sm:py-0">
        <span aria-hidden="true" />
        <div className="flex items-center justify-center gap-8 sm:gap-6">
          <button
            onClick={onPrevious}
            className="w-12 h-12 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[var(--palette-9ca3af)] hover:text-[var(--color-static-white)] hover:bg-[var(--alpha-ffffff-06)] active:scale-95 transition-all duration-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-pink)] motion-reduce:transform-none motion-reduce:transition-none"
            aria-label={t.discography.previousTrack}
          >
            <ChevronLeft className="w-6 h-6 sm:w-5 sm:h-5" aria-hidden="true" />
          </button>
          <button
            onClick={onTogglePlay}
            disabled={!audioHref}
            aria-label={isPlaying ? t.discography.pause : t.discography.play}
            title={audioHref ? (isPlaying ? t.discography.pause : t.discography.play) : t.discography.noAudio}
            className="w-14 h-14 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-pink)] motion-reduce:transform-none motion-reduce:transition-none"
            style={{
              backgroundColor: albumColor,
              color: "var(--color-static-black)",
              transition: "background-color 0.5s, transform var(--duration-base)",
            }}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 sm:w-5 sm:h-5" aria-hidden="true" />
            ) : (
              <Play className="w-6 h-6 sm:w-5 sm:h-5 pl-0.5" aria-hidden="true" />
            )}
          </button>
          <button
            onClick={onNext}
            className="w-12 h-12 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[var(--palette-9ca3af)] hover:text-[var(--color-static-white)] hover:bg-[var(--alpha-ffffff-06)] active:scale-95 transition-all duration-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-pink)] motion-reduce:transform-none motion-reduce:transition-none"
            aria-label={t.discography.nextTrack}
          >
            <ChevronRight className="w-6 h-6 sm:w-5 sm:h-5" aria-hidden="true" />
          </button>
        </div>
        {youtubeHref ? (
          <a
            href={youtubeHref}
            target="_blank"
            rel="noreferrer"
            aria-label={`${track?.title ?? ""} ${t.discography.musicVideo}`}
            className="discography-youtube-button justify-self-end"
          >
              <CirclePlay aria-hidden="true" />
            <span>MV</span>
          </a>
        ) : (
          <span aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
