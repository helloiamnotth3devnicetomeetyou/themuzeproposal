import type { Locale } from "@/core/providers/LocaleContext";
import TypoLogoMask from "@/core/components/media/TypoLogoMask";
import { localizeText } from "@/core/i18n/localized";
import { useLocale } from "@/core/providers/LocaleContext";
import Image from "next/image";
import { SiSpotify } from "react-icons/si";

import type {
  DiscographyAlbum,
  DiscographyGalleryItem,
  DiscographyMember,
  DiscographyTab,
} from "../lib/types";
import { MemberGallery } from "./MemberGallery";
import { TrackList } from "./TrackList";
import { TrackPlayer } from "./TrackPlayer";

interface AlbumDetailsProps {
  activeTab: DiscographyTab;
  album: DiscographyAlbum;
  currentTrackIndex: number;
  hoveredDisc: number | null;
  isPlaying: boolean;
  locale: Locale;
  members?: DiscographyMember[];
  gallery?: DiscographyGalleryItem[];
  time: {
    current: string;
    total: string;
  };
  onNextTrack: () => void;
  onPlayTrack: (index: number) => void;
  onPreviousTrack: () => void;
  onTabChange: (tab: DiscographyTab) => void;
  onTogglePlay: () => void;
}

export function AlbumDetails({
  activeTab,
  album,
  currentTrackIndex,
  hoveredDisc,
  isPlaying,
  locale,
  members = [],
  gallery = [],
  time,
  onNextTrack,
  onPlayTrack,
  onPreviousTrack,
  onTabChange,
  onTogglePlay,
}: AlbumDetailsProps) {
  const { t } = useLocale();
  const currentTrack = album.tracks[currentTrackIndex];
  const tabs: Array<{ id: DiscographyTab; label: string }> = [
    { id: "concept", label: t.discography.tabs.concept },
    { id: "intro", label: t.discography.tabs.intro },
    { id: "members", label: t.discography.tabs.members },
  ];

  return (
    <div className="hidden lg:col-span-5 lg:flex flex-col gap-4 w-full relative z-20 h-auto min-h-[620px] lg:h-full lg:min-h-0 lg:max-h-[600px]">
      <div className="shrink-0">
        <span className="text-[10px] font-medium uppercase text-[var(--color-static-white)]">
          {album.type}
        </span>
        <div className="flex items-center justify-between mt-1">
          <h2 className="font-hero text-4xl font-black leading-none tracking-tight text-[var(--color-static-white)] md:text-5xl w-full flex items-center min-h-[2.5rem] md:min-h-[3rem]">
            {album.typoLogoUrl ? (
              <TypoLogoMask
                src={album.typoLogoUrl}
                label={album.title}
                className="block bg-current"
                style={{
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
              rel="noreferrer"
              className="w-8 h-8 rounded-full border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-[rgba(255,255,255,0.6)] hover:text-[#1DB954] hover:border-[#1DB954] transition-all duration-300"
            >
              <SiSpotify className="w-4 h-4" />
            </a>
          </div>
        </div>
        <p className="text-xs text-[rgba(255,255,255,0.35)] mt-1 font-mono">
          {album.releaseDate}
        </p>
      </div>

      <div className="flex border-b border-[rgba(255,255,255,0.08)] shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 text-xs font-bold transition-all relative ${
              activeTab === tab.id
                ? "text-[var(--color-static-white)]"
                : "text-[rgba(255,255,255,0.4)] hover:text-[rgba(255,255,255,0.7)]"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: album.color }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 relative">
        {activeTab === "concept" && (
          <div className="absolute inset-0 overflow-y-auto pr-1 animate-slideIn">
            {album.titleImage ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-4 border border-[rgba(255,255,255,0.1)]">
                <Image
                  src={album.titleImage}
                  alt={album.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ) : null}
            <p className="text-sm text-[var(--palette-9ca3af)] font-light leading-relaxed max-w-md">
              {localizeText(album.desc, locale, t.discography.noDescription)}
            </p>
          </div>
        )}

        {activeTab === "intro" && (
          <div className="absolute inset-0 flex flex-col gap-4 animate-slideIn">
            <p className="text-sm text-[var(--palette-9ca3af)] font-light leading-relaxed max-w-md shrink-0">
              {localizeText(album.desc, locale, t.discography.noDescription)}
            </p>
            <TrackPlayer
              albumColor={album.color}
              isPlaying={isPlaying}
              time={time}
              track={currentTrack}
              onNext={onNextTrack}
              onPrevious={onPreviousTrack}
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
            <MemberGallery
              album={album}
              members={members}
              gallery={gallery}
              albumColor={album.color}
            />
          </div>
        )}
      </div>
    </div>
  );
}
