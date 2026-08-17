import Image from "next/image";
import { memo, type CSSProperties } from "react";

import type { DiscographyAlbum } from "@/public/features/discography/types";
import { DISCOGRAPHY_COVER_SIZES } from "@/public/features/discography/cover-preload";

interface DiscographyBackgroundProps {
  album: DiscographyAlbum;
  isPlaying: boolean;
}

export const DiscographyBackground = memo(function DiscographyBackground({
  album,
  isPlaying,
}: DiscographyBackgroundProps) {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div
        className="absolute inset-[-80px] transition-opacity duration-700"
        style={{ willChange: "opacity" }}
      >
        <Image
          key={album.id}
          src={album.cover}
          alt=""
          fill
          sizes={DISCOGRAPHY_COVER_SIZES}
          className="object-cover blur-[80px] scale-[1.28] brightness-[0.12] saturate-150 transition-opacity duration-700"
        />
      </div>
      <div
        className={`discography-ambient-layer ${isPlaying ? "is-playing" : ""}`}
        style={{ "--album-accent": album.color } as CSSProperties}
        aria-hidden="true"
      >
        <span className="discography-ambient-orb is-primary" />
        <span className="discography-ambient-orb is-secondary" />
        <span className="discography-ambient-orb is-glow" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--alpha-000000-4)] via-transparent to-[var(--alpha-000000-6)]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--alpha-000000-5)] via-transparent to-[var(--alpha-000000-3)]" />
    </div>
  );
});
