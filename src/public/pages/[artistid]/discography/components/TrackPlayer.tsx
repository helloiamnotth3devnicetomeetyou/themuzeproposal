import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { SiYoutube } from "react-icons/si";
import type { CSSProperties } from "react";
import { useLocale } from "@/core/providers/LocaleContext";
import { safeHref } from "@/core/http/safe-href";

import type { DiscographyTrack } from "../lib/types";

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
  return (
    <div className="flex shrink-0 flex-col gap-3 border-y border-[var(--alpha-ffffff-1)] py-4">
      <div className="flex items-center justify-between">
        <span className="min-w-0 truncate font-display text-[15px] font-medium tracking-[-0.01em] text-[var(--color-static-white)]">
          {track?.title}
        </span>
        <span className="shrink-0 font-display text-[9px] font-medium tabular-nums tracking-[0.04em] text-[var(--palette-737373)]">
          {time.current} / {time.total}
        </span>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        step="0.1"
        value={progress}
        onChange={(event) => onSeek(Number(event.currentTarget.value))}
        disabled={!audioHref}
        aria-label={t.discography.progress}
        className="h-5 w-full min-w-0 cursor-pointer appearance-none border-0 bg-transparent outline-none disabled:cursor-default disabled:opacity-30 [&::-moz-range-thumb]:h-2 [&::-moz-range-thumb]:w-2 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[color:var(--track-accent)] [&::-moz-range-thumb]:bg-[var(--bg-base)] [&::-moz-range-thumb]:shadow-none [&::-moz-range-track]:h-[2px] [&::-moz-range-track]:rounded-full [&::-moz-range-track]:border-0 [&::-moz-range-track]:bg-[image:var(--track-gradient)] [&::-moz-range-track]:shadow-none [&::-moz-focus-outer]:border-0 [&::-webkit-slider-runnable-track]:h-[2px] [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:border-0 [&::-webkit-slider-runnable-track]:bg-[image:var(--track-gradient)] [&::-webkit-slider-runnable-track]:shadow-none [&::-webkit-slider-thumb]:mt-[-4.5px] [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[color:var(--track-accent)] [&::-webkit-slider-thumb]:bg-[var(--bg-base)] [&::-webkit-slider-thumb]:shadow-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-brand-pink)]"
        style={
          {
            "--track-accent": albumColor,
            "--track-gradient": `linear-gradient(to right, ${albumColor} 0 ${Math.min(100, Math.max(0, progress))}%, var(--alpha-ffffff-1) ${Math.min(100, Math.max(0, progress))}% 100%)`,
          } as CSSProperties
        }
      />

      <div className="grid grid-cols-[1fr_auto_1fr] items-center pt-0.5">
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
