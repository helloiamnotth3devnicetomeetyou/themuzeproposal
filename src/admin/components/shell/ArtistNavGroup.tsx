"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

interface Artist {
  id: string;
  name: string;
  logo_url: string | null;
}

interface ArtistLink {
  label: string;
  segment: string;
}

interface ArtistNavGroupProps {
  artist: Artist;
  isExpanded: boolean;
  onToggle: () => void;
  pathname: string;
  artistLinks: ArtistLink[];
  BRAND_PINK_HEX?: string;
}

export default function ArtistNavGroup({
  artist,
  isExpanded,
  onToggle,
  pathname,
  artistLinks,
}: ArtistNavGroupProps) {
  return (
    <div className={`cms-artist-group ${isExpanded ? "is-expanded" : ""}`}>
      <button
        type="button"
        className="cms-artist-heading"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <span>
          <span className="cms-artist-logo">
            {artist.logo_url ? (
              <Image
                src={artist.logo_url}
                alt=""
                width={20}
                height={20}
                unoptimized
                className={
                  /\.svg(?:$|\?)/i.test(artist.logo_url)
                    ? "is-theme-svg"
                    : undefined
                }
              />
            ) : (
              <i />
            )}
          </span>
          {artist.name}
        </span>
        <b>
          <ChevronDown aria-hidden="true" />
        </b>
      </button>
      {isExpanded && (
        <div className="cms-artist-links">
          {artistLinks.map((item) => {
            const href = `/admin/artists/${artist.id}/${item.segment}`;
            return (
              <Link
                key={item.label}
                href={href}
                className={`cms-artist-link ${
                  pathname === href ||
                  (item.label === "음악 · 디스코그래피" &&
                    pathname.includes(`/artists/${artist.id}/tracks`))
                    ? "is-active"
                    : ""
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
