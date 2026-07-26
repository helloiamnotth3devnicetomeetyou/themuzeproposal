import type { Locale } from "@/core/providers/LocaleContext";
import Image from "next/image";
import { SiSpotify } from "react-icons/si";

import type { DiscographyAlbum, DiscographyTab } from "../lib/types";
import { TrackList } from "./TrackList";
import { TrackPlayer } from "./TrackPlayer";

const TABS: Array<{ id: DiscographyTab; label: string }> = [
  { id: "concept", label: "Concept" },
  { id: "intro", label: "Track Intro" },
  { id: "members", label: "Members" },
];

interface AlbumDetailsProps {
  activeTab: DiscographyTab;
  album: DiscographyAlbum;
  audioDuration: number;
  currentTrackIndex: number;
  hoveredDisc: number | null;
  isPlaying: boolean;
  locale: Locale;
  progress: number;
  time: {
    current: string;
    total: string;
  };
  onNextTrack: () => void;
  onPlayTrack: (index: number) => void;
  onPreviousTrack: () => void;
  onSeek: (progress: number) => void;
  onTabChange: (tab: DiscographyTab) => void;
  onTogglePlay: () => void;
}

export function AlbumDetails({
  activeTab,
  album,
  audioDuration,
  currentTrackIndex,
  hoveredDisc,
  isPlaying,
  locale,
  progress,
  time,
  onNextTrack,
  onPlayTrack,
  onPreviousTrack,
  onSeek,
  onTabChange,
  onTogglePlay,
}: AlbumDetailsProps) {
  const currentTrack = album.tracks[currentTrackIndex];

  return (
    <div className="lg:col-span-5 flex flex-col gap-4 w-full relative z-20 h-full max-h-[600px]">
      <div className="shrink-0">
        <span
          className="text-[10px] font-black tracking-[0.3em] uppercase text-[rgba(255,255,255,0.45)]"
        >
          {album.type}
        </span>
        <div className="flex items-center justify-between mt-1">
          <h2 className="font-hero text-4xl font-black leading-none tracking-tight text-[var(--color-static-white)] md:text-5xl w-full flex items-center min-h-[2.5rem] md:min-h-[3rem]">
            {album.typoLogoUrl ? (
              <span
                aria-label={album.title}
                className="block bg-current"
                style={{
                  WebkitMaskImage: `url("${album.typoLogoUrl}")`,
                  maskImage: `url("${album.typoLogoUrl}")`,
                  WebkitMaskPosition: "left center",
                  maskPosition: "left center",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  width: "100%",
                  height: "clamp(2.5rem, 6vw, 3.5rem)",
                }}
              />
            ) : (
              album.title
            )}
          </h2>
          <div className="flex gap-2 shrink-0">
            <a
              href={album.links?.spotify || "#"}
              target="_blank"
              aria-label={`${album.title} on Spotify`}
              className="w-8 h-8 rounded-full border border-[var(--alpha-ffffff-1)] flex items-center justify-center hover:bg-[var(--alpha-ffffff-1)] transition-colors text-[var(--color-static-white)] hover:text-[var(--palette-e5e7eb)]"
            >
              <SiSpotify className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>
        <p className="text-[11px] text-[var(--palette-6b7280)] font-medium tracking-wider mt-2">
          {album.releaseDate}
        </p>
      </div>

      <div className="flex gap-5 border-b border-[var(--alpha-ffffff-1)] pb-1.5 mt-1 relative shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`font-sans text-[11.5px] tracking-normal transition-all duration-base relative pb-2 font-medium ${
              activeTab === tab.id
                ? "text-[var(--color-static-white)] font-semibold"
                : "text-[var(--palette-6b7280)] hover:text-[var(--palette-e5e7eb)]"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span
                className="absolute -bottom-[1.5px] left-0 right-0 h-[2px] rounded-full shadow-[0_0_8px_var(--alpha-ffffff-8)] transition-all duration-base"
                style={{ backgroundColor: album.color }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 relative min-h-[300px]">
        {activeTab === "concept" && (
          <div className="absolute inset-0 animate-slideIn flex flex-col">
            <div className="relative w-full flex-1 rounded-2xl overflow-hidden border border-[var(--alpha-ffffff-1)] shadow-lg group">
              <Image
                src={album.titleImage || album.cover}
                alt={`${album.title} title image`}
                fill
                sizes="(max-width: 1024px) 100vw, 500px"
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-[var(--alpha-000000-2)] group-hover:bg-transparent transition-colors duration-700 pointer-events-none" />
            </div>
          </div>
        )}

        {activeTab === "intro" && (
          <div className="absolute inset-0 flex flex-col gap-4 animate-slideIn">
            <p className="text-sm text-[var(--palette-9ca3af)] font-light leading-relaxed max-w-md shrink-0">
              {album.desc[locale]}
            </p>
            <TrackPlayer
              albumColor={album.color}
              audioDuration={audioDuration}
              isPlaying={isPlaying}
              progress={progress}
              time={time}
              track={currentTrack}
              onNext={onNextTrack}
              onPrevious={onPreviousTrack}
              onSeek={onSeek}
              onTogglePlay={onTogglePlay}
            />
            <TrackList
              album={album}
              currentTrackIndex={currentTrackIndex}
              hoveredDisc={hoveredDisc}
              isPlaying={isPlaying}
              onPlayTrack={onPlayTrack}
            />
          </div>
        )}

        {activeTab === "members" && (
          <div className="absolute inset-0 animate-slideIn">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 h-full">
              <p className="col-span-full self-center text-sm text-[var(--palette-6b7280)]">
                등록된 멤버 정보가 없습니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
