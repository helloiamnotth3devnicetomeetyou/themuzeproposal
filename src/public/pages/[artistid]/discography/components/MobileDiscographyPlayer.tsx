"use client";

import type { Locale } from "@/core/providers/LocaleContext";

import type {
  DiscographyAlbum,
  DiscographyGalleryItem,
  DiscographyMember,
} from "../lib/types";
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
  time: { current: string; total: string };
  view: MobileView;
  onIntentAlbum: (index: number) => void;
  onNextTrack: () => void;
  onPlayTrack: (index: number) => void;
  onPreviousTrack: () => void;
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
  time,
  view,
  onIntentAlbum,
  onNextTrack,
  onPlayTrack,
  onPreviousTrack,
  onSelectAlbum,
  onTogglePlay,
  onViewChange,
}: MobileDiscographyPlayerProps) {
  const tabClass = (tab: MobileView) =>
    `flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-[10px] font-bold tracking-[0.1em] transition-[background-color,color,transform] duration-base active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 ${view === tab ? "text-[var(--color-static-black)]" : "text-[var(--palette-9ca3af)]"}`;

  return (
    <section className="w-full font-[family-name:var(--font-sans)]">
      <div
        className="sticky z-30 -mx-5 bg-[var(--alpha-080808-65)] px-5 pb-3 pt-2 backdrop-blur-xl"
        style={{
          top: "calc(var(--banner-height, 0px) + var(--site-header-height))",
        }}
      >
        <header
          role="tablist"
          aria-label="Discography view"
          className="grid grid-cols-2 gap-1 rounded-xl border border-[var(--alpha-ffffff-08)] bg-[var(--alpha-ffffff-025)] p-1"
        >
          {(["album", "tracks"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={view === tab}
              aria-controls={`discography-${tab}-panel`}
              className={tabClass(tab)}
              onClick={() => onViewChange(tab)}
              style={{
                backgroundColor: view === tab ? album.color : "transparent",
              }}
            >
              {tab.toUpperCase()}
              {tab === "tracks" && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[8px] leading-none ${view === tab ? "bg-[var(--alpha-000000-18)]" : "bg-[var(--alpha-ffffff-08)]"}`}
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
          currentTrackIndex={currentTrackIndex}
          gallery={gallery}
          isPlaying={isPlaying}
          locale={locale}
          members={members}
          time={time}
          onIntentAlbum={onIntentAlbum}
          onSelectAlbum={onSelectAlbum}
          onTogglePlay={onTogglePlay}
          onOpenTracks={() => onViewChange("tracks")}
        />
      ) : (
        <MobileTracksView
          album={album}
          currentTrackIndex={currentTrackIndex}
          hoveredDisc={hoveredDisc}
          isPlaying={isPlaying}
          time={time}
          track={album.tracks[currentTrackIndex]}
          onNextTrack={onNextTrack}
          onPlayTrack={onPlayTrack}
          onPreviousTrack={onPreviousTrack}
          onTogglePlay={onTogglePlay}
        />
      )}
    </section>
  );
}
