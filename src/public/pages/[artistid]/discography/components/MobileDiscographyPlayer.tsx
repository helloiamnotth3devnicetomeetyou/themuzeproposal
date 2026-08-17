"use client";

import type { Locale } from "@/core/providers/LocaleContext";

import type {
  DiscographyAlbum,
  DiscographyGalleryItem,
  DiscographyMember,
} from "@/public/features/discography/types";
import { MobileAlbumView } from "./MobileAlbumView";
import { MobileTracksView } from "./MobileTracksView";

type MobileView = "album" | "tracks";

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
  view: MobileView;
  onIntentAlbum: (index: number) => void;
  onNextTrack: () => void;
  onPlayTrack: (index: number) => void;
  onPreviousTrack: () => void;
  onSeek: (nextProgress: number) => void;
  onSelectAlbum: (index: number) => void;
  onTogglePlay: () => void;
  onViewChange: (view: MobileView) => void;
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
  view,
  onIntentAlbum,
  onNextTrack,
  onPlayTrack,
  onPreviousTrack,
  onSeek,
  onSelectAlbum,
  onTogglePlay,
  onViewChange,
}: MobileDiscographyPlayerProps) {
  return (
    <section className="w-full min-w-0 max-w-full font-[family-name:var(--font-sans)]">
      <div
        className="sticky z-30 -mx-5 bg-[var(--alpha-080808-65)] px-5 pb-3 pt-2 backdrop-blur-xl md:-mx-8 md:px-8"
        style={{
          top: "calc(var(--banner-height, 0px) + var(--site-header-height))",
        }}
      >
        <header
          role="tablist"
          aria-label="Discography view"
          className="-mx-5 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] border-y border-[var(--alpha-ffffff-08)] bg-[var(--alpha-ffffff-025)] px-5 md:-mx-8 md:px-8"
        >
          {(["album", "tracks"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={view === tab}
              aria-controls={`discography-${tab}-panel`}
              onClick={() => onViewChange(tab)}
              className={`flex min-w-0 min-h-10 items-center justify-center gap-1.5 px-2 text-[10px] font-bold tracking-[0.1em] ${view === tab ? "text-[var(--color-static-black)]" : "text-[var(--palette-9ca3af)]"}`}
              style={{
                backgroundColor: view === tab ? album.color : "transparent",
              }}
            >
              {tab.toUpperCase()}
              {tab === "tracks" && (
                <span
                  className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] leading-none ${view === tab ? "bg-[var(--alpha-000000-18)]" : "bg-[var(--alpha-ffffff-08)]"}`}
                >
                  {String(album.tracks.length).padStart(2, "0")}
                </span>
              )}
            </button>
          ))}
        </header>
      </div>
      {view === "album" ? (
        <MobileAlbumView
          album={album}
          albumIndex={albumIndex}
          albums={albums}
          artistName={artistName}
          gallery={gallery}
          isPlaying={isPlaying}
          locale={locale}
          members={members}
          onIntentAlbum={onIntentAlbum}
          onSelectAlbum={onSelectAlbum}
          onTogglePlay={onTogglePlay}
        />
      ) : (
        <MobileTracksView
          album={album}
          currentTrackIndex={currentTrackIndex}
          hoveredDisc={hoveredDisc}
          isPlaying={isPlaying}
          progress={progress}
          time={time}
          track={album.tracks[currentTrackIndex]}
          onNextTrack={onNextTrack}
          onPlayTrack={onPlayTrack}
          onPreviousTrack={onPreviousTrack}
          onSeek={onSeek}
          onTogglePlay={onTogglePlay}
        />
      )}
    </section>
  );
}
