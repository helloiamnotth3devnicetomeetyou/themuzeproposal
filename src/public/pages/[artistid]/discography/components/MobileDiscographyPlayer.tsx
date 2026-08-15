"use client";

import type { Locale } from "@/core/providers/LocaleContext";

import type {
  DiscographyAlbum,
  DiscographyGalleryItem,
  DiscographyMember,
} from "../lib/types";
import { MobileAlbumView } from "./MobileAlbumView";
import { TrackList } from "./TrackList";
import { TrackPlayer } from "./TrackPlayer";

interface MobileDiscographyPlayerProps {
  album: DiscographyAlbum;
  albumIndex: number;
  albums: DiscographyAlbum[];
  artistName: string;
  currentTrackIndex: number;
  gallery: DiscographyGalleryItem[];
  hoveredDisc: number | null;
  isPlaying: boolean;
  locale: Locale;
  members: DiscographyMember[];
  progress: number;
  time: { current: string; total: string };
  onIntentAlbum: (index: number) => void;
  onNextTrack: () => void;
  onPlayTrack: (index: number) => void;
  onPreviousTrack: () => void;
  onSeek: (nextProgress: number) => void;
  onSelectAlbum: (index: number) => void;
  onTogglePlay: () => void;
}

export function MobileDiscographyPlayer({
  album,
  albumIndex,
  albums,
  artistName,
  currentTrackIndex,
  gallery,
  hoveredDisc,
  isPlaying,
  locale,
  members,
  progress,
  time,
  onIntentAlbum,
  onNextTrack,
  onPlayTrack,
  onPreviousTrack,
  onSeek,
  onSelectAlbum,
  onTogglePlay,
}: MobileDiscographyPlayerProps) {
  return (
    <section className="w-full font-[family-name:var(--font-sans)]">
      <MobileAlbumView
        album={album}
        albumIndex={albumIndex}
        albums={albums}
        artistName={artistName}
        gallery={gallery}
        locale={locale}
        members={members}
        onIntentAlbum={onIntentAlbum}
        onSelectAlbum={onSelectAlbum}
      />
      <div
        className="sticky z-30 -mx-5 border-y border-[var(--alpha-ffffff-08)] bg-[var(--alpha-080808-82)] px-5 py-3 backdrop-blur-xl"
        style={{
          top: "calc(var(--banner-height, 0px) + var(--site-header-height))",
        }}
      >
        <TrackPlayer
          albumColor={album.color}
          isPlaying={isPlaying}
          progress={progress}
          time={time}
          track={album.tracks[currentTrackIndex]}
          onNext={onNextTrack}
          onPrevious={onPreviousTrack}
          onSeek={onSeek}
          onTogglePlay={onTogglePlay}
        />
      </div>
      <div className="mt-5 px-1">
        <TrackList
          layout="flow"
          album={album}
          currentTrackIndex={currentTrackIndex}
          hoveredDisc={hoveredDisc}
          isPlaying={isPlaying}
          onPlayTrack={onPlayTrack}
        />
      </div>
    </section>
  );
}
