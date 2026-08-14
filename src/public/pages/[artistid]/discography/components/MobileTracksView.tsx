"use client";

import type { DiscographyAlbum, DiscographyTrack } from "../lib/types";
import { TrackList } from "./TrackList";
import { TrackPlayer } from "./TrackPlayer";

interface MobileTracksViewProps {
  album: DiscographyAlbum;
  currentTrackIndex: number;
  hoveredDisc: number | null;
  isPlaying: boolean;
  time: { current: string; total: string };
  track: DiscographyTrack | undefined;
  onNextTrack: () => void;
  onPlayTrack: (index: number) => void;
  onPreviousTrack: () => void;
  onTogglePlay: () => void;
}

export function MobileTracksView({
  album,
  currentTrackIndex,
  hoveredDisc,
  isPlaying,
  time,
  track,
  onNextTrack,
  onPlayTrack,
  onPreviousTrack,
  onTogglePlay,
}: MobileTracksViewProps) {
  return (
    <div
      id="discography-tracks-panel"
      role="tabpanel"
      className="animate-page-fade -mx-5 min-h-[calc(100dvh-var(--site-header-height))] pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4"
    >
      <div
        className="sticky z-20 -mx-5 border-b border-[var(--alpha-ffffff-08)] bg-[var(--alpha-050505-30)] px-5 pb-4 pt-3 backdrop-blur-md"
        style={{
          top: "calc(var(--banner-height, 0px) + var(--site-header-height) + 40px)",
        }}
      >
        <TrackPlayer
          albumColor={album.color}
          isPlaying={isPlaying}
          time={time}
          track={track}
          onNext={onNextTrack}
          onPrevious={onPreviousTrack}
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
