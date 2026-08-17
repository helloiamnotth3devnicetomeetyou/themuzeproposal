"use client";

import type { DiscographyAlbum, DiscographyTrack } from "@/public/features/discography/types";
import { TrackList } from "./TrackList";
import { TrackPlayer } from "./TrackPlayer";

interface MobileTracksViewProps {
  album: DiscographyAlbum;
  currentTrackIndex: number;
  hoveredDisc: number | null;
  isPlaying: boolean;
  progress: number;
  time: { current: string; total: string };
  track: DiscographyTrack | undefined;
  onNextTrack: () => void;
  onPlayTrack: (index: number) => void;
  onPreviousTrack: () => void;
  onSeek: (nextProgress: number) => void;
  onTogglePlay: () => void;
}

export function MobileTracksView({
  album,
  currentTrackIndex,
  hoveredDisc,
  isPlaying,
  progress,
  time,
  track,
  onNextTrack,
  onPlayTrack,
  onPreviousTrack,
  onSeek,
  onTogglePlay,
}: MobileTracksViewProps) {
  return (
    <div
      id="discography-tracks-panel"
      role="tabpanel"
      className="animate-page-fade w-full min-w-0 min-h-[calc(100dvh-var(--site-header-height))] pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4"
    >
      <div className="w-full max-w-full border-b border-[var(--alpha-ffffff-08)] pb-4 pt-3">
        <TrackPlayer
          albumColor={album.color}
          isPlaying={isPlaying}
          progress={progress}
          time={time}
          track={track}
          onNext={onNextTrack}
          onPrevious={onPreviousTrack}
          onSeek={onSeek}
          onTogglePlay={onTogglePlay}
        />
      </div>
      <div className="mt-2 flex items-center justify-between px-1 pb-2">
        <span className="text-sm font-medium text-[var(--palette-9ca3af)]">
          {album.title}
        </span>
        <span className="text-[10px] text-[var(--palette-4b5563)]">
          {album.tracks.length} TRACKS
        </span>
      </div>
      <TrackList
        layout="flow"
        album={album}
        currentTrackIndex={currentTrackIndex}
        hoveredDisc={hoveredDisc}
        isPlaying={isPlaying}
        onPlayTrack={onPlayTrack}
      />
    </div>
  );
}
