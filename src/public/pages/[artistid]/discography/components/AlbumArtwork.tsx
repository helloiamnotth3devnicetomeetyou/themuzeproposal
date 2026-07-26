import Image from "next/image";
import { LuChevronRight } from "react-icons/lu";

import type { DiscographyAlbum } from "../lib/types";

interface AlbumArtworkProps {
  album: DiscographyAlbum;
  artistName: string;
  currentTrackIndex: number;
  hoveredDisc: number | null;
  isPlaying: boolean;
  showDiscs: boolean;
  onHoverDisc: (index: number | null) => void;
  onSelectTrack: (index: number) => void;
  onToggleDiscs: () => void;
}

export function AlbumArtwork({
  album,
  artistName,
  currentTrackIndex,
  hoveredDisc,
  isPlaying,
  showDiscs,
  onHoverDisc,
  onSelectTrack,
  onToggleDiscs,
}: AlbumArtworkProps) {
  return (
    <div
      className="lg:col-span-7 flex justify-center items-center relative"
      style={{ perspective: "1600px" }}
    >
      <div
        className="relative select-none"
        style={{
          width: "clamp(280px, 36vw, 440px)",
          height: "clamp(280px, 36vw, 440px)",
          transformStyle: "preserve-3d",
        }}
      >
        {album.tracks.map((track, trackIndex) => {
          const total = album.tracks.length;
          const isActiveTrack = currentTrackIndex === trackIndex;
          const fanX = showDiscs ? 90 + trackIndex * 58 : 0;
          const fanY = showDiscs
            ? (trackIndex - (total - 1) / 2) * 20
            : 0;
          const fanZ = showDiscs ? -(60 + trackIndex * 15) : -30;
          const fanRotZ = showDiscs
            ? (trackIndex - (total - 1) / 2) * 4
            : 0;

          return (
            <div
              key={`${album.id}-disc-${trackIndex}`}
              onClick={(event) => {
                event.stopPropagation();
                if (showDiscs) onSelectTrack(trackIndex);
              }}
              onMouseEnter={() => showDiscs && onHoverDisc(trackIndex)}
              onMouseLeave={() => {
                if (hoveredDisc === trackIndex) onHoverDisc(null);
              }}
              className={`absolute rounded-full group/cd ${
                showDiscs ? "cursor-pointer" : ""
              }`}
              style={{
                width: "78%",
                aspectRatio: "1 / 1",
                left: "50%",
                top: "50%",
                transform: `translate(-50%, -50%) translateX(${fanX}px) translateY(${fanY}px) translateZ(${fanZ}px) rotateZ(${fanRotZ}deg)`,
                transition: `transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) ${
                  trackIndex * 0.05
                }s, opacity 0.5s, filter 0.2s, z-index 0s`,
                transformStyle: "preserve-3d",
                zIndex:
                  hoveredDisc === trackIndex
                    ? 100
                    : showDiscs
                      ? 40 + trackIndex
                      : 5 - trackIndex,
                willChange: "transform",
                opacity: showDiscs ? 1 : 0,
                pointerEvents: showDiscs ? "auto" : "none",
              }}
            >
              <div
                className={`absolute inset-0 rounded-full overflow-hidden transition-shadow duration-base group-hover/cd:shadow-[0_0_40px_var(--alpha-ffffff-15)] ${
                  isActiveTrack && isPlaying
                    ? "animate-vinyl-spin"
                    : "animate-vinyl-spin animation-paused"
                }`}
                style={{
                  border: isActiveTrack
                    ? `3px solid ${album.color}`
                    : "2px solid var(--alpha-0f0f0f-95)",
                  boxShadow: isActiveTrack
                    ? `0 0 30px ${album.color}40, 0 8px 35px var(--alpha-000000-6)`
                    : "0 6px 25px var(--alpha-000000-5)",
                  willChange: "transform",
                }}
              >
                 <Image
                  key={`${album.id}-disc-img-${trackIndex}`}
                  src={album.cover}
                  alt={track.title}
                  fill
                  className="object-cover brightness-[0.5] group-hover/cd:brightness-[0.7] transition-[filter] duration-base"
                  sizes="300px"
                />
                <div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle, transparent 26%, var(--alpha-000000-3) 28%, transparent 30%, transparent 46%, var(--alpha-000000-2) 48%, transparent 50%, transparent 66%, var(--alpha-000000-12) 68%, transparent 70%, transparent 86%, var(--alpha-000000-08) 88%, transparent 90%)",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[28%] h-[28%] rounded-full overflow-hidden border-2 border-[var(--alpha-000000-7)] relative">
                    <Image
                      key={`${album.id}-disc-center-${trackIndex}`}
                      src={album.cover}
                      alt=""
                      fill
                      className="object-cover opacity-60 scale-[1.8]"
                      sizes="100px"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-[22%] h-[22%] rounded-full bg-[var(--color-static-black)] border border-[var(--alpha-ffffff-1)]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div
          onClick={onToggleDiscs}
          className="absolute inset-0 rounded-2xl overflow-hidden cursor-pointer z-30 group"
          style={{
            transform: showDiscs
              ? "rotateY(-28deg) rotateX(3deg) translateZ(40px)"
              : "rotateY(0deg) translateZ(0px)",
            transition:
              "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.7s ease",
            transformStyle: "preserve-3d",
            boxShadow: showDiscs
              ? `18px 12px 50px var(--alpha-000000-85), 0 0 60px ${album.color}10`
              : "0 18px 50px var(--alpha-000000-7)",
            border: `1px solid ${
              showDiscs ? `${album.color}40` : "var(--alpha-ffffff-05)"
            }`,
            willChange: "transform",
          }}
        >
          <Image
            key={album.id}
            src={album.cover}
            alt={album.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 440px"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--alpha-ffffff-08)] via-transparent to-transparent pointer-events-none" />
          <div
            className="absolute bottom-5 left-5 px-3 py-1.5 rounded shadow-lg flex flex-col select-none"
            style={{
              backgroundColor: album.color,
              color: "var(--color-static-black)",
              boxShadow: `0 4px 18px ${album.color}35`,
            }}
          >
            <span className="text-[6px] font-display font-bold tracking-[0.2em] opacity-60">
              {artistName}
            </span>
            <span className="text-[11px] font-black tracking-tight">
              {album.title}
            </span>
          </div>
          <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[var(--alpha-000000-4)] backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-slow border border-[var(--alpha-ffffff-08)]">
            <LuChevronRight
              className={`w-3.5 h-3.5 text-[var(--color-static-white)] transition-transform duration-500 ${
                showDiscs ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
