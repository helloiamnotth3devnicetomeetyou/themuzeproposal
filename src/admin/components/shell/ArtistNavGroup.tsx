"use client";

import {
  type MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
  isCollapsed?: boolean;
  onNavigate?: MouseEventHandler<HTMLAnchorElement>;
}

export default function ArtistNavGroup({
  artist,
  isExpanded,
  onToggle,
  pathname,
  artistLinks,
  isCollapsed = false,
  onNavigate,
}: ArtistNavGroupProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const [popupPos, setPopupPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const headingRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<number | undefined>(undefined);

  const cancelClose = useCallback(() => {
    window.clearTimeout(closeTimerRef.current);
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimerRef.current = window.setTimeout(() => setIsHovered(false), 200);
  }, [cancelClose]);

  useEffect(() => cancelClose, [cancelClose]);

  const updatePosition = useCallback(() => {
    if (headingRef.current) {
      const rect = headingRef.current.getBoundingClientRect();
      const popupHeight = 180;
      const top = Math.min(rect.top, window.innerHeight - popupHeight - 12);
      setPopupPos({ top: Math.max(12, top), left: rect.right + 10 });
    }
  }, []);

  useEffect(() => {
    if ((isHovered || hasFocus) && isCollapsed) {
      updatePosition();
    }
  }, [hasFocus, isHovered, isCollapsed, updatePosition]);

  const showCollapsedPopup = isCollapsed && (isHovered || hasFocus);

  return (
    <div
      className={`cms-artist-group ${isExpanded ? "is-expanded" : ""}`}
      onMouseEnter={() => {
        cancelClose();
        setIsHovered(true);
      }}
      onMouseLeave={scheduleClose}
      onFocusCapture={() => setHasFocus(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setHasFocus(false);
      }}
    >
      <button
        ref={headingRef}
        type="button"
        className="cms-artist-heading"
        onClick={onToggle}
        aria-expanded={isExpanded}
        title={isCollapsed ? artist.name : undefined}
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

      {/* Expanded links for non-collapsed sidebar */}
      {!isCollapsed && isExpanded && (
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
                onClick={onNavigate}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Floating popup for collapsed sidebar */}
      {showCollapsedPopup && popupPos && (
        <div
          className="cms-artist-collapsed-popup"
          style={{
            position: "fixed",
            top: popupPos.top,
            left: popupPos.left,
            zIndex: 9999,
          }}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <div className="cms-artist-collapsed-popup-header">{artist.name}</div>
          <div className="cms-artist-collapsed-popup-links">
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
                  onClick={(event) => {
                    setIsHovered(false);
                    onNavigate?.(event);
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
