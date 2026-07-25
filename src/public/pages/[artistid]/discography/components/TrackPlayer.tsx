import type { CSSProperties } from "react";
import {
  LuChevronLeft,
  LuChevronRight,
  LuPause,
  LuPlay,
} from "react-icons/lu";
import { SiYoutube } from "react-icons/si";

import type { DiscographyTrack } from "../lib/types";

interface TrackPlayerProps {
  albumColor: string;
  audioDuration: number;
  isPlaying: boolean;
  progress: number;
  time: {
    current: string;
    total: string;
  };
  track?: DiscographyTrack;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (progress: number) => void;
  onTogglePlay: () => void;
}

export function TrackPlayer({
  albumColor,
  audioDuration,
  isPlaying,
  progress,
  time,
  track,
  onNext,
  onPrevious,
  onSeek,
  onTogglePlay,
}: TrackPlayerProps) {
  return (
    <div
      className="p-4 rounded-2xl flex flex-col gap-3 shrink-0"
      style={{
        backgroundColor: "var(--alpha-ffffff-025)",
        border: "1px solid var(--alpha-ffffff-05)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <span className="text-[8px] text-[var(--palette-4b5563)] font-black tracking-[0.15em] block">
            NOW PLAYING
          </span>
          <span className="text-base font-bold text-[var(--color-static-white)] block truncate mt-0.5">
            {track?.title}
          </span>
        </div>
        <span className="text-[10px] text-[var(--palette-6b7280)] shrink-0">
          {time.current} / {time.total}
        </span>
      </div>

      <label className="discography-progress-wrap">
        <span className="sr-only">{track?.title} 재생 위치</span>
        <input
          className="discography-progress"
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress}
          disabled={!track?.audioUrl || !audioDuration}
          aria-valuetext={`${time.current} / ${time.total}`}
          style={
            {
              "--progress": `${progress}%`,
              "--album-accent": albumColor,
            } as CSSProperties
          }
          onChange={(event) => onSeek(Number(event.currentTarget.value))}
        />
      </label>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center mt-1">
        <span aria-hidden="true" />
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={onPrevious}
            className="text-[var(--palette-6b7280)] hover:text-[var(--color-static-white)] transition-colors duration-200"
            aria-label="이전 트랙"
          >
            <LuChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <button
            onClick={onTogglePlay}
            disabled={!track?.audioUrl}
            title={track?.audioUrl ? "재생" : "등록된 MP3가 없습니다"}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
            style={{
              backgroundColor: albumColor,
              color: "var(--color-static-black)",
              transition: "background-color 0.5s, transform 0.2s",
            }}
          >
            {isPlaying ? (
              <LuPause className="w-5 h-5" aria-hidden="true" />
            ) : (
              <LuPlay className="w-5 h-5 pl-0.5" aria-hidden="true" />
            )}
          </button>
          <button
            onClick={onNext}
            className="text-[var(--palette-6b7280)] hover:text-[var(--color-static-white)] transition-colors duration-200"
            aria-label="다음 트랙"
          >
            <LuChevronRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        {track?.youtubeUrl ? (
          <a
            href={track.youtubeUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`${track.title} 뮤직비디오 보기`}
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
