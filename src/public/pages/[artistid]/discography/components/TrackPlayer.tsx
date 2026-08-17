import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { SiYoutube } from "react-icons/si";
import { useLocale } from "@/core/providers/LocaleContext";
import { safeHref } from "@/core/http/safe-href";

import type { DiscographyTrack } from "@/public/features/discography/types";

interface TrackPlayerProps {
  albumColor: string;
  isPlaying: boolean;
  progress: number;
  time: {
    current: string;
    total: string;
  };
  track?: DiscographyTrack;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (nextProgress: number) => void;
  onTogglePlay: () => void;
}

export function TrackPlayer({
  albumColor,
  isPlaying,
  progress,
  time,
  track,
  onNext,
  onPrevious,
  onSeek,
  onTogglePlay,
}: TrackPlayerProps) {
  const { t } = useLocale();
  const audioHref = safeHref(track?.audioUrl);
  const youtubeHref = safeHref(track?.youtubeUrl);
  const safeProgress = Math.min(100, Math.max(0, progress));
  return (
    <div className="flex w-full max-w-full min-w-0 shrink-0 flex-col gap-3 border-y border-[var(--alpha-ffffff-1)] py-4">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <span className="min-w-0 truncate font-display text-[15px] font-medium tracking-[-0.01em] text-[var(--color-static-white)]">
          {track?.title}
        </span>
        <span className="shrink-0 font-display text-[9px] font-medium tabular-nums tracking-[0.04em] text-[var(--palette-737373)]">
          {time.current} / {time.total}
        </span>
      </div>

      <div className="group relative h-5 w-full">
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[var(--alpha-ffffff-1)]"
        />
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full"
          style={{ width: `${safeProgress}%`, backgroundColor: albumColor }}
        />
        <span
          aria-hidden="true"
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-[var(--bg-base)] group-focus-within:ring-2 group-focus-within:ring-[var(--color-brand-pink)] group-focus-within:ring-offset-2 group-focus-within:ring-offset-[var(--bg-base)]"
          style={{ left: `${safeProgress}%`, borderColor: albumColor }}
        />
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={safeProgress}
          onChange={(event) => onSeek(Number(event.currentTarget.value))}
          disabled={!audioHref}
          aria-label={t.discography.progress}
          className="absolute inset-0 z-10 h-5 w-full cursor-pointer opacity-0 disabled:cursor-default"
        />
      </div>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center pt-0.5">
        <span aria-hidden="true" />
        <div className="flex items-center justify-center gap-8 sm:gap-6">
          <button
            type="button"
            onClick={onPrevious}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--palette-9ca3af)] transition-colors duration-base hover:text-[var(--color-static-white)] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-pink)] motion-reduce:transform-none motion-reduce:transition-none"
            aria-label={t.discography.previousTrack}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            disabled={!audioHref}
            aria-label={isPlaying ? t.discography.pause : t.discography.play}
            title={
              audioHref
                ? isPlaying
                  ? t.discography.pause
                  : t.discography.play
                : t.discography.noAudio
            }
            className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--color-static-black)] shadow-[0_6px_16px_var(--alpha-000000-25)] transition-colors duration-base active:translate-y-px disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-pink)] motion-reduce:transform-none motion-reduce:transition-none"
            style={{ backgroundColor: albumColor }}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4 pl-px" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={onNext}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--palette-9ca3af)] transition-colors duration-base hover:text-[var(--color-static-white)] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-pink)] motion-reduce:transform-none motion-reduce:transition-none"
            aria-label={t.discography.nextTrack}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
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
            <SiYoutube aria-hidden="true" />
            <span>MV</span>
          </a>
        ) : (
          <span aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
