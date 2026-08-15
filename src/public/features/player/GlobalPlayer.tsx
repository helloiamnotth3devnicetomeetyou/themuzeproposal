"use client";

import Image from "next/image";
import {
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useLocale } from "@/core/providers/LocaleContext";
import { usePlayer, type PlayerTrack } from "./PlayerProvider";
import styles from "@/styles/(public)/components/layout/Navbar.module.css";

function Artwork({
  track,
  size,
  className,
}: {
  track: PlayerTrack;
  size: number;
  className?: string;
}) {
  const src = track.albumCover;
  return (
    <span
      className={`${styles.playerArtwork} ${className || ""}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes={`${size}px`}
          unoptimized={/\.svg(?:$|\?)/i.test(src)}
          className="object-cover"
        />
      ) : (
        <span className={styles.playerArtworkFallback} />
      )}
    </span>
  );
}

function SeekBar({
  duration,
  progress,
  onSeek,
  label,
}: {
  duration: number;
  progress: number;
  onSeek: (progress: number) => void;
  label: string;
}) {
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const safeProgress = Math.min(100, Math.max(0, progress));
  return (
    <input
      type="range"
      min={0}
      max={100}
      step={0.1}
      value={safeProgress}
      disabled={!safeDuration}
      aria-label={label}
      className={styles.playerSeek}
      style={{ "--player-progress": `${safeProgress}%` } as CSSProperties}
      onChange={(event) => onSeek(event.currentTarget.valueAsNumber)}
    />
  );
}

export default function GlobalPlayer() {
  const { t } = useLocale();
  const player = usePlayer();
  const { currentTrack: track, isPlaying, duration, progress, time } = player;
  const copy = {
    nowPlaying: t.discography.nowPlaying,
    play: t.discography.play,
    pause: t.discography.pause,
    previous: t.discography.previousTrack,
    next: t.discography.nextTrack,
    progress: t.discography.progress,
    open: t.discography.nowPlaying,
    close: t.common.closeMenu,
  };
  const visible = Boolean(track);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileCollapsed, setMobileCollapsed] = useState(false);
  const desktopRef = useRef<HTMLDivElement>(null);
  const desktopTriggerRef = useRef<HTMLButtonElement>(null);

  const closeDesktop = useCallback(() => setDesktopOpen(false), []);

  useEffect(() => {
    if (!visible && desktopOpen) {
      let cancelled = false;
      queueMicrotask(() => {
        if (!cancelled) closeDesktop();
      });
      return () => {
        cancelled = true;
      };
    }
  }, [closeDesktop, desktopOpen, visible]);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(max-width: 1279px)");
    const syncHeight = () =>
      root.style.setProperty(
        "--global-player-height",
        media.matches && visible ? (mobileCollapsed ? "16px" : "52px") : "0px",
      );
    syncHeight();
    media.addEventListener("change", syncHeight);
    return () => {
      media.removeEventListener("change", syncHeight);
      root.style.setProperty("--global-player-height", "0px");
    };
  }, [mobileCollapsed, visible]);

  useEffect(() => {
    if (!desktopOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!desktopRef.current?.contains(event.target as Node)) closeDesktop();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeDesktop();
      desktopTriggerRef.current?.focus();
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeDesktop, desktopOpen]);

  if (!track) {
    return (
      <div
        className={`${styles.playerDock} ${styles.playerDockHidden}`}
        aria-hidden="true"
      />
    );
  }

  const title = track.title;
  const artist = track.artistName;
  const album = track.albumTitle;
  const toggle = player.togglePlay;
  const previous = player.previousTrack;
  const next = player.nextTrack;
  const seek = player.seek;
  const visibilityClass = visible
    ? styles.playerDockVisible
    : styles.playerDockHidden;

  return (
    <div
      className={`${styles.playerDock} ${visibilityClass} ${mobileCollapsed ? styles.playerDockCollapsed : ""}`}
      aria-hidden={!visible}
    >
      <div
        className={styles.playerDesktopBar}
        ref={desktopRef}
        style={{ "--player-accent": track.albumColor } as CSSProperties}
      >
        <button
          ref={desktopTriggerRef}
          type="button"
          className={styles.playerBadge}
          onClick={() => setDesktopOpen((open) => !open)}
          aria-expanded={desktopOpen}
          aria-controls="global-player-popover"
          aria-label={`${copy.open}: ${title}`}
        >
          <Artwork track={track} size={34} />
          <span
            className={styles.playerBadgeProgress}
            aria-hidden="true"
            style={
              {
                "--player-progress": `${progress}%`,
                "--player-accent": track.albumColor,
              } as CSSProperties
            }
          />
        </button>

        <section
          id="global-player-popover"
          className={`${styles.playerPopover} ${desktopOpen ? styles.playerPopoverOpen : ""}`}
          role="dialog"
          aria-label={`${copy.nowPlaying}: ${title}`}
          aria-hidden={!desktopOpen}
        >
          <div className={styles.playerPopoverHeader}>
            <Artwork track={track} size={54} />
            <div className={styles.playerTrackCopy}>
              <strong title={title}>{title}</strong>
              <span title={`${artist}${album ? ` - ${album}` : ""}`}>
                {artist}
                {album ? ` - ${album}` : ""}
              </span>
            </div>
            <div className={styles.playerControls}>
              <button
                type="button"
                className={styles.playerIconButton}
                onClick={previous}
                aria-label={copy.previous}
              >
                <SkipBack aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`${styles.playerIconButton} ${styles.playerPrimaryButton}`}
                onClick={toggle}
                aria-label={isPlaying ? copy.pause : copy.play}
              >
                {isPlaying ? (
                  <Pause aria-hidden="true" />
                ) : (
                  <Play aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                className={styles.playerIconButton}
                onClick={next}
                aria-label={copy.next}
              >
                <SkipForward aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className={styles.playerPopoverTimeline}>
            <SeekBar
              duration={duration}
              progress={progress}
              onSeek={seek}
              label={copy.progress}
            />
            <div className={styles.playerTime} aria-live="off">
              <span>{time.current}</span>
              <span>{time.total}</span>
            </div>
          </div>
        </section>
      </div>

      <div
        className={styles.playerMobileBar}
        style={{ "--player-accent": track.albumColor } as CSSProperties}
      >
        <Artwork
          track={track}
          size={36}
          className={styles.playerMobileArtwork}
        />
        <div className={styles.playerTrackCopy}>
          <strong title={title}>{title}</strong>
          <span title={artist}>{artist}</span>
        </div>
        <button
          type="button"
          className={styles.playerIconButton}
          onClick={previous}
          aria-label={copy.previous}
        >
          <SkipBack aria-hidden="true" />
        </button>
        <button
          type="button"
          className={`${styles.playerIconButton} ${styles.playerPrimaryButton}`}
          onClick={toggle}
          aria-label={isPlaying ? copy.pause : copy.play}
        >
          {isPlaying ? (
            <Pause aria-hidden="true" />
          ) : (
            <Play aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          className={styles.playerIconButton}
          onClick={next}
          aria-label={copy.next}
        >
          <SkipForward aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.playerMobileCollapse}
          onClick={() => setMobileCollapsed((collapsed) => !collapsed)}
          aria-label={mobileCollapsed ? copy.open : copy.close}
          aria-expanded={!mobileCollapsed}
        >
          {mobileCollapsed ? (
            <ChevronDown aria-hidden="true" />
          ) : (
            <ChevronUp aria-hidden="true" />
          )}
        </button>
        <span
          className={styles.playerMobileProgress}
          aria-hidden="true"
          style={{ "--player-progress": `${progress}%` } as CSSProperties}
        />
      </div>
    </div>
  );
}
