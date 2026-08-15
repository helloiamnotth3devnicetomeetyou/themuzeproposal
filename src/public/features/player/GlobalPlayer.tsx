"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
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
  const pathname = usePathname();
  const player = usePlayer();
  const {
    currentTrack: track,
    isPlaying,
    currentTime,
    duration,
    progress,
    time,
  } = player;
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
  const hiddenOnDiscography = /^\/[^/]+\/discography\/?$/.test(pathname);
  const visible = Boolean(track) && !hiddenOnDiscography;
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRef = useRef<HTMLElement>(null);
  const sheetTriggerRef = useRef<HTMLButtonElement>(null);

  const closeSheet = useCallback(() => setSheetOpen(false), []);

  useEffect(() => {
    if (!visible && sheetOpen) {
      let cancelled = false;
      queueMicrotask(() => {
        if (!cancelled) closeSheet();
      });
      return () => {
        cancelled = true;
      };
    }
  }, [closeSheet, sheetOpen, visible]);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(max-width: 1279px)");
    const syncHeight = () =>
      root.style.setProperty(
        "--global-player-height",
        visible ? (media.matches ? "56px" : "64px") : "0px",
      );
    syncHeight();
    media.addEventListener("change", syncHeight);
    return () => {
      media.removeEventListener("change", syncHeight);
      root.style.setProperty("--global-player-height", "0px");
    };
  }, [visible]);

  useEffect(() => {
    if (!sheetOpen) return;
    const focusReturnTarget = sheetTriggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = requestAnimationFrame(() => {
      sheetRef.current
        ?.querySelector<HTMLElement>(
          "button:not([disabled]), input:not([disabled])",
        )
        ?.focus();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSheet();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        sheetRef.current?.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled])",
        ) ?? [],
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      requestAnimationFrame(() => focusReturnTarget?.focus());
    };
  }, [closeSheet, sheetOpen]);

  if (!track) {
    return (
      <>
        <div
          className={`${styles.playerDock} ${styles.playerDockHidden}`}
          aria-hidden="true"
        />
        <div className={styles.playerSheetLayer} aria-hidden="true" />
      </>
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

  const onSheetKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSheet();
    }
  };

  return (
    <>
      <div
        className={`${styles.playerDock} ${visibilityClass}`}
        aria-hidden={!visible}
      >
        <div className={styles.playerDesktopBar}>
          <div className={styles.playerTrackMeta}>
            <Artwork track={track} size={42} />
            <div className={styles.playerTrackCopy}>
              <span className={styles.playerEyebrow}>{copy.nowPlaying}</span>
              <strong title={title}>{title}</strong>
              <span title={`${artist}${album ? ` - ${album}` : ""}`}>
                {artist}
                {album ? ` - ${album}` : ""}
              </span>
            </div>
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
          <div className={styles.playerTimeline}>
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
        </div>

        <div className={styles.playerMobileBar}>
          <button
            type="button"
            className={styles.playerMobileSummary}
            onClick={() => setSheetOpen(true)}
            ref={sheetTriggerRef}
            aria-label={copy.open}
          >
            <Artwork track={track} size={38} />
            <span className={styles.playerTrackCopy}>
              <strong title={title}>{title}</strong>
              <span title={artist}>{artist}</span>
            </span>
            <ChevronUp aria-hidden="true" className={styles.playerOpenIcon} />
          </button>
          <button
            type="button"
            className={`${styles.playerIconButton} ${styles.playerMobilePlay}`}
            onClick={toggle}
            aria-label={isPlaying ? copy.pause : copy.play}
          >
            {isPlaying ? (
              <Pause aria-hidden="true" />
            ) : (
              <Play aria-hidden="true" />
            )}
          </button>
          <div className={styles.playerMobileProgress}>
            <span
              style={{
                width: duration ? `${(currentTime / duration) * 100}%` : "0%",
              }}
            />
          </div>
        </div>
      </div>

      <div
        className={`${styles.playerSheetLayer} ${sheetOpen && visible ? styles.playerSheetOpen : ""}`}
        aria-hidden={!sheetOpen || !visible}
      >
        <button
          type="button"
          className={styles.playerSheetBackdrop}
          onClick={closeSheet}
          aria-label={copy.close}
          tabIndex={sheetOpen && visible ? 0 : -1}
        />
        <section
          ref={sheetRef}
          className={styles.playerSheet}
          role="dialog"
          aria-modal="true"
          aria-label={`${copy.nowPlaying}: ${title}`}
          onKeyDown={onSheetKeyDown}
        >
          <div className={styles.playerSheetHandle} aria-hidden="true" />
          <button
            type="button"
            className={`${styles.playerIconButton} ${styles.playerSheetClose}`}
            onClick={closeSheet}
            aria-label={copy.close}
          >
            <X aria-hidden="true" />
          </button>
          <Artwork
            track={track}
            size={220}
            className={styles.playerSheetArtwork}
          />
          <div className={styles.playerSheetCopy}>
            <span className={styles.playerEyebrow}>{copy.nowPlaying}</span>
            <h2>{title}</h2>
            <p>
              {artist}
              {album ? ` - ${album}` : ""}
            </p>
          </div>
          <SeekBar
            duration={duration}
            progress={progress}
            onSeek={seek}
            label={copy.progress}
          />
          <div className={styles.playerSheetTime}>
            <span>{time.current}</span>
            <span>{time.total}</span>
          </div>
          <div className={styles.playerSheetControls}>
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
              className={`${styles.playerIconButton} ${styles.playerPrimaryButton} ${styles.playerSheetPrimary}`}
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
          <button
            type="button"
            className={styles.playerSheetCollapse}
            onClick={closeSheet}
          >
            <ChevronDown aria-hidden="true" />
            {copy.close}
          </button>
        </section>
      </div>
    </>
  );
}
