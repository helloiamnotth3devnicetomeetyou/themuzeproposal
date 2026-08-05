"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, ListMusic, Pause, Play } from "lucide-react";
import { useRef, type MouseEvent, type TouchEvent } from "react";
import { localizeText } from "@/core/i18n/localized";
import { safeHref } from "@/core/http/safe-href";
import { useLocale, type Locale } from "@/core/providers/LocaleContext";

import type { DiscographyAlbum, DiscographyGalleryItem, DiscographyMember } from "../lib/types";
import { MemberGallery } from "./MemberGallery";
import { TrackList } from "./TrackList";
import { TrackPlayer } from "./TrackPlayer";

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
  const { t } = useLocale();
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const swipeContainerRef = useRef<HTMLDivElement | null>(null);
  const track = album.tracks[currentTrackIndex];
  const canPlay = Boolean(safeHref(track?.audioUrl));
  const previousAlbum = albums[albumIndex - 1];
  const nextAlbum = albums[albumIndex + 1];

  const selectAlbum = (index: number) => {
    if (!albums[index]) return;
    onIntentAlbum(index);
    onSelectAlbum(index);
  };

  const openTracks = ({ currentTarget }: MouseEvent<HTMLButtonElement>) => {
    if (typeof currentTarget.animate !== "function" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      onViewChange("tracks");
      return;
    }

    currentTarget.disabled = true;
    const finish = () => onViewChange("tracks");
    currentTarget.animate(
      [
        { transform: "perspective(900px) rotateY(0deg) scale(1)", opacity: 1 },
        { transform: "perspective(900px) rotateY(90deg) scale(.96)", opacity: 0.3 },
      ],
      { duration: 220, easing: "cubic-bezier(.4, 0, .2, 1)", fill: "forwards" },
    ).finished.then(finish, finish);
  };

  /** 드래그 중 커버 컨테이너를 손가락을 따라 translateX (rubber-band 적용) */
  const onSwipeMove = (event: TouchEvent<HTMLDivElement>) => {
    const start = swipeStart.current;
    if (!start) return;
    const touch = event.touches[0];
    if (!touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    // 세로 스크롤이 주 방향이면 무시
    if (Math.abs(dy) > Math.abs(dx) * 1.2) return;
    event.stopPropagation();
    const el = swipeContainerRef.current;
    if (!el) return;
    // 끝에서 당기면 저항감 (rubber-band)
    const atEdge = (dx > 0 && !previousAlbum) || (dx < 0 && !nextAlbum);
    const damped = atEdge ? dx * 0.25 : dx * 0.82;
    el.style.transition = "none";
    el.style.transform = `translateX(${damped}px)`;
  };

  const endSwipe = (event: TouchEvent<HTMLDivElement>) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    const el = swipeContainerRef.current;
    const touch = event.changedTouches[0];
    if (!start || !touch) return;
    const x = touch.clientX - start.x;
    const y = touch.clientY - start.y;

    // 원위치 스냅 (스프링감)
    const snapBack = () => {
      if (!el) return;
      el.style.transition = "transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)";
      el.style.transform = "translateX(0px)";
    };

    if (Math.abs(x) < 52 || Math.abs(x) <= Math.abs(y)) {
      snapBack();
      return;
    }
    event.preventDefault();
    const dir = x < 0 ? 1 : -1;
    const nextIndex = albumIndex + dir;
    if (!albums[nextIndex]) {
      snapBack();
      return;
    }

    // 앨범 전환은 즉시 — 이미지가 캐시에 있으므로 빈 화면 없음
    selectAlbum(nextIndex);

    // 시각적 exit → enter 애니메이션 (fire-and-forget, 테스트에 영향 없음)
    if (el) {
      const exitX = dir < 0 ? 120 : -120;
      el.style.transition = "transform 0.18s cubic-bezier(0.4, 0, 1, 1)";
      el.style.transform = `translateX(${exitX}px)`;
      const onEnd = () => {
        el.removeEventListener("transitionend", onEnd);
        el.style.transition = "none";
        el.style.transform = `translateX(${-exitX}px)`;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.style.transition = "transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)";
            el.style.transform = "translateX(0px)";
          });
        });
      };
      el.addEventListener("transitionend", onEnd, { once: true });
    }
  };

  const tabClass = (tab: MobileView) => `relative min-h-11 px-4 py-2 text-xs font-bold transition-colors ${view === tab ? "text-[var(--color-static-white)]" : "text-[var(--palette-6b7280)]"}`;

  return (
    <section className="w-full min-h-[100dvh]">
      <header role="tablist" aria-label="Discography view" className="flex shrink-0 border-b border-[var(--alpha-ffffff-08)]">
        {(["album", "tracks"] as const).map((tab) => (
          <button key={tab} type="button" role="tab" aria-selected={view === tab} className={tabClass(tab)} onClick={() => onViewChange(tab)}>
            {tab.toUpperCase()}
            {view === tab && <span className="absolute inset-x-0 bottom-0 h-0.5" style={{ backgroundColor: album.color }} />}
          </button>
        ))}
      </header>

      {view === "album" ? (
        <div className="animate-slideIn pb-8 pt-5">
          <div
            ref={swipeContainerRef}
            className="relative -mx-5 overflow-hidden px-5 py-3 touch-pan-y will-change-transform"
            onTouchStart={(event) => {
              const touch = event.touches[0];
              if (touch) swipeStart.current = { x: touch.clientX, y: touch.clientY };
            }}
            onTouchMove={onSwipeMove}
            onTouchEnd={endSwipe}
            onTouchCancel={() => {
              swipeStart.current = null;
              const el = swipeContainerRef.current;
              if (el) {
                el.style.transition = "transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)";
                el.style.transform = "translateX(0px)";
              }
            }}
          >
            {previousAlbum && (
              <button type="button" onClick={() => selectAlbum(albumIndex - 1)} aria-label={t.discography.previousAlbum} className="absolute left-[-68%] top-[11%] z-0 aspect-square w-[76%] overflow-hidden rounded-2xl border border-[var(--alpha-ffffff-05)] opacity-35">
                <Image src={previousAlbum.cover} alt="" fill sizes="75vw" className="object-cover" />
              </button>
            )}
            {nextAlbum && (
              <button type="button" onClick={() => selectAlbum(albumIndex + 1)} aria-label={t.discography.nextAlbum} className="absolute right-[-68%] top-[11%] z-0 aspect-square w-[76%] overflow-hidden rounded-2xl border border-[var(--alpha-ffffff-05)] opacity-35">
                <Image src={nextAlbum.cover} alt="" fill sizes="75vw" className="object-cover" />
              </button>
            )}
            <button type="button" aria-label="TRACKS" onClick={openTracks} className="relative z-10 mx-auto block aspect-square w-[calc(100%-32px)] max-w-[390px] overflow-hidden rounded-2xl border border-[var(--alpha-ffffff-08)] text-left" style={{ boxShadow: `0 24px 60px ${album.color}38`, transformStyle: "preserve-3d" }}>
              <Image src={album.cover} alt={album.title} fill priority sizes="(max-width: 640px) calc(100vw - 72px), 390px" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--alpha-ffffff-08)] via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 rounded-lg px-3 py-2 text-left" style={{ backgroundColor: album.color, color: "var(--color-static-black)" }}>
                <span className="block font-display text-[7px] font-bold tracking-[0.16em] opacity-60">{artistName}</span>
                <strong className="block max-w-52 truncate font-display text-xs font-black tracking-tight">{album.title}</strong>
              </div>
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button type="button" disabled={!previousAlbum} onClick={() => selectAlbum(albumIndex - 1)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--alpha-ffffff-08)] bg-[var(--alpha-ffffff-025)] text-[var(--palette-9ca3af)] disabled:opacity-25" aria-label={t.discography.previousAlbum}><ChevronLeft className="h-5 w-5" aria-hidden="true" /></button>
            <div className="min-w-0 flex-1 text-center"><span className="font-display text-[9px] font-black tracking-[0.14em] text-[var(--palette-6b7280)]">ALBUM {String(albumIndex + 1).padStart(2, "0")} / {String(albums.length).padStart(2, "0")}</span></div>
            <button type="button" disabled={!nextAlbum} onClick={() => selectAlbum(albumIndex + 1)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--alpha-ffffff-08)] bg-[var(--alpha-ffffff-025)] text-[var(--palette-9ca3af)] disabled:opacity-25" aria-label={t.discography.nextAlbum}><ChevronRight className="h-5 w-5" aria-hidden="true" /></button>
          </div>

          <div className="mt-3 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="font-display text-[10px] font-bold tracking-[0.14em] text-[var(--palette-9ca3af)] uppercase">{album.type}</p>
              <h1 className="mt-1 flex min-h-10 items-center font-hero text-4xl font-black leading-none tracking-[-0.055em] text-[var(--color-static-white)]">
                {album.typoLogoUrl ? (
                  <span
                    aria-label={album.title}
                    className="block h-10 w-full bg-current"
                    style={{
                      WebkitMask: `url("${album.typoLogoUrl}") left center / contain no-repeat`,
                      mask: `url("${album.typoLogoUrl}") left center / contain no-repeat`,
                    }}
                  />
                ) : album.title}
              </h1>
              <p className="mt-2 font-mono text-[11px] text-[var(--palette-6b7280)]">{artistName} · {album.releaseDate}</p>
            </div>
            <button type="button" disabled={!canPlay} onClick={onTogglePlay} className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[var(--color-static-black)] shadow-lg active:scale-95 disabled:opacity-30" style={{ backgroundColor: album.color }} aria-label={isPlaying ? t.discography.pause : t.discography.play}>
              {isPlaying ? <Pause className="h-6 w-6" aria-hidden="true" /> : <Play className="h-6 w-6 pl-0.5" aria-hidden="true" />}
            </button>
          </div>

          {track && (
            <button type="button" onClick={() => onViewChange("tracks")} className="mt-5 flex min-h-16 w-full items-center gap-3 rounded-xl border border-[var(--alpha-ffffff-08)] bg-[var(--alpha-ffffff-025)] p-2.5 text-left backdrop-blur-md">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg"><Image src={album.cover} alt="" fill sizes="44px" className="object-cover" /></div>
              <div className="min-w-0 flex-1"><span className="block font-display text-[8px] font-bold tracking-[0.14em] text-[var(--palette-6b7280)]">{t.discography.nowPlaying}</span><strong className="mt-0.5 block truncate text-sm text-[var(--color-static-white)]">{track.title}</strong></div>
              <span className="font-mono text-[10px] text-[var(--palette-6b7280)]">{time.current} / {time.total}</span>
              <ListMusic className="h-4 w-4 shrink-0" style={{ color: album.color }} aria-hidden="true" />
            </button>
          )}

          <section className="mt-8 border-t border-[var(--alpha-ffffff-08)] pt-6">
            <h2 className="font-display text-xs font-black tracking-[0.14em] text-[var(--color-static-white)]">INTRO</h2>
            <p className="mt-3 text-sm font-light leading-6 text-[var(--palette-9ca3af)]">{localizeText(album.desc, locale, t.discography.noDescription)}</p>
          </section>

          {album.titleImage && (
            <section className="mt-8 border-t border-[var(--alpha-ffffff-08)] pt-6">
              <h2 className="mb-3 font-display text-xs font-black tracking-[0.14em] text-[var(--color-static-white)]">{t.discography.tabs.concept}</h2>
              <div className="relative aspect-video overflow-hidden rounded-xl border border-[var(--alpha-ffffff-08)]"><Image src={album.titleImage} alt={album.title} fill sizes="calc(100vw - 40px)" className="object-cover" /></div>
            </section>
          )}

          <section className="mt-8 h-[520px] border-t border-[var(--alpha-ffffff-08)] pt-6">
            <h2 className="mb-3 font-display text-xs font-black tracking-[0.14em] text-[var(--color-static-white)]">{t.discography.tabs.members}</h2>
            <div className="h-[470px]"><MemberGallery album={album} members={members} gallery={gallery} albumColor={album.color} /></div>
          </section>
        </div>
      ) : (
        <div className="animate-page-fade pb-8 pt-4">
          <div className="sticky top-[72px] z-20 -mx-2 rounded-b-2xl bg-[var(--alpha-ffffff-025)] px-2 pb-4 pt-1 backdrop-blur-2xl">
            <TrackPlayer albumColor={album.color} isPlaying={isPlaying} time={time} track={track} onNext={onNextTrack} onPrevious={onPreviousTrack} onTogglePlay={onTogglePlay} />
          </div>
          <div className="mt-2 flex items-center justify-between px-1 pb-2">
            <span className="font-display text-[10px] font-black tracking-[0.14em] text-[var(--palette-9ca3af)]">{album.title}</span>
            <span className="font-mono text-[9px] text-[var(--palette-4b5563)]">{album.tracks.length} TRACKS</span>
          </div>
          <TrackList layout="flow" album={album} currentTrackIndex={currentTrackIndex} hoveredDisc={hoveredDisc} isPlaying={isPlaying} onPlayTrack={onPlayTrack} />
        </div>
      )}
    </section>
  );
}
