"use client";

import Image from "next/image";
import { ListMusic } from "lucide-react";
import { useLayoutEffect, useRef, type TouchEvent } from "react";
import TypoLogoMask from "@/core/components/media/TypoLogoMask";
import { localizeText } from "@/core/i18n/localized";
import { useLocale, type Locale } from "@/core/providers/LocaleContext";

import type {
  DiscographyAlbum,
  DiscographyGalleryItem,
  DiscographyMember,
} from "../lib/types";
import { MemberGallery } from "./MemberGallery";

interface MobileAlbumViewProps {
  album: DiscographyAlbum;
  albumIndex: number;
  albums: DiscographyAlbum[];
  artistName: string;
  gallery: DiscographyGalleryItem[];
  locale: Locale;
  members: DiscographyMember[];
  onIntentAlbum: (index: number) => void;
  onSelectAlbum: (index: number) => void;
}

export function MobileAlbumView({
  album,
  albumIndex,
  albums,
  artistName,
  gallery,
  locale,
  members,
  onIntentAlbum,
  onSelectAlbum,
}: MobileAlbumViewProps) {
  const { t } = useLocale();
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const albumTrackRef = useRef<HTMLDivElement | null>(null);
  const albumRailRef = useRef<HTMLElement | null>(null);
  const transitioningRef = useRef(false);
  const previousAlbum = albums[albumIndex - 1];
  const nextAlbum = albums[albumIndex + 1];

  useLayoutEffect(() => {
    const track = albumTrackRef.current;
    if (track) {
      track.style.transition = "none";
      track.style.transform = "translate3d(-33.333333%, 0, 0)";
    }
    transitioningRef.current = false;

    const rail = albumRailRef.current;
    const current = rail?.querySelector<HTMLElement>(
      `[data-album-index="${albumIndex}"]`,
    );
    if (!rail || !current) return;
    const railRect = rail.getBoundingClientRect();
    const currentRect = current.getBoundingClientRect();
    const targetScrollLeft =
      rail.scrollLeft +
      currentRect.left -
      railRect.left -
      (rail.clientWidth - currentRect.width) / 2;
    if (typeof rail.scrollTo === "function") {
      rail.scrollTo({
        left: targetScrollLeft,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    } else {
      rail.scrollLeft = targetScrollLeft;
    }
  }, [album.id, albumIndex]);

  const selectAlbum = (index: number) => {
    if (!albums[index] || transitioningRef.current) return;
    transitioningRef.current = true;
    const track = albumTrackRef.current;
    if (track) {
      track.style.transition = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches
        ? "none"
        : "transform .22s cubic-bezier(.22, .8, .24, 1)";
      track.style.transform = `translate3d(${index > albumIndex ? "-66.666667%" : "0%"}, 0, 0)`;
    }
    onIntentAlbum(index);
    onSelectAlbum(index);
  };

  /** 드래그 중 커버 컨테이너를 손가락 위치에 따라 이동합니다(rubber-band 적용). */
  const onSwipeMove = (event: TouchEvent<HTMLDivElement>) => {
    const start = swipeStart.current;
    if (!start) return;
    const touch = event.touches[0];
    if (!touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    // 세로 스크롤 중에는 수평 스와이프를 무시
    if (Math.abs(dy) > Math.abs(dx) * 1.2) return;
    event.stopPropagation();
    const track = albumTrackRef.current;
    if (!track) return;
    // 가장자리에서 당기면 rubber-band 효과 적용
    const atEdge = (dx > 0 && !previousAlbum) || (dx < 0 && !nextAlbum);
    const damped = atEdge ? dx * 0.25 : dx * 0.82;
    track.style.transition = "none";
    track.style.transform = `translate3d(calc(-33.333333% + ${damped}px), 0, 0)`;
  };

  const endSwipe = (event: TouchEvent<HTMLDivElement>) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    const track = albumTrackRef.current;
    const touch = event.changedTouches[0];
    if (!start || !touch) return;
    const x = touch.clientX - start.x;
    const y = touch.clientY - start.y;

    // 좌우 이동을 계산해 앨범을 전환
    const snapBack = () => {
      if (!track) return;
      track.style.transition = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches
        ? "none"
        : "transform .32s cubic-bezier(.22, 1, .36, 1)";
      track.style.transform = "translate3d(-33.333333%, 0, 0)";
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

    selectAlbum(nextIndex);
  };

  return (
    <div id="discography-album-panel" role="tabpanel" className="pb-8 pt-4">
      <div
        className="relative -mx-5 overflow-hidden py-3 touch-pan-y"
        onTouchStart={(event) => {
          const touch = event.touches[0];
          if (touch)
            swipeStart.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchMove={onSwipeMove}
        onTouchEnd={endSwipe}
        onTouchCancel={() => {
          swipeStart.current = null;
          const track = albumTrackRef.current;
          if (track) {
            track.style.transition = window.matchMedia(
              "(prefers-reduced-motion: reduce)",
            ).matches
              ? "none"
              : "transform .32s cubic-bezier(.22, 1, .36, 1)";
            track.style.transform = "translate3d(-33.333333%, 0, 0)";
          }
        }}
      >
        <div
          ref={albumTrackRef}
          className="mobile-album-track flex w-[300%] will-change-transform"
        >
          <div className="w-1/3 shrink-0 px-4" aria-hidden="true">
            <div className="relative mx-auto aspect-square w-full max-w-[390px] overflow-hidden rounded-[1.35rem]">
              {previousAlbum && (
                <Image
                  src={previousAlbum.cover}
                  alt=""
                  fill
                  loading="eager"
                  sizes="(max-width: 640px) calc(100vw - 72px), 390px"
                  className="object-cover"
                />
              )}
            </div>
          </div>
          <div className="w-1/3 shrink-0 px-4">
            <div className="group relative mx-auto block aspect-square w-full max-w-[390px] overflow-hidden rounded-xl border border-[var(--alpha-ffffff-08)]">
              <Image
                src={album.cover}
                alt={album.title}
                fill
                priority
                sizes="(max-width: 640px) calc(100vw - 72px), 390px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[var(--alpha-ffffff-08)] via-transparent to-[var(--alpha-000000-45)]" />
              <div className="absolute bottom-3 right-3 flex min-h-8 items-center gap-2 rounded-md border border-[var(--alpha-ffffff-12)] bg-[var(--alpha-050505-54)] px-2.5 text-[var(--color-static-white)] backdrop-blur-md transition-transform duration-base group-active:translate-y-px">
                <ListMusic
                  className="h-3.5 w-3.5"
                  style={{ color: album.color }}
                  aria-hidden="true"
                />
                <span className="font-display text-[8px] font-bold tracking-[0.08em]">
                  {String(album.tracks.length).padStart(2, "0")} TRACKS
                </span>
              </div>
            </div>
          </div>
          <div className="w-1/3 shrink-0 px-4" aria-hidden="true">
            <div className="relative mx-auto aspect-square w-full max-w-[390px] overflow-hidden rounded-[1.35rem]">
              {nextAlbum && (
                <Image
                  src={nextAlbum.cover}
                  alt=""
                  fill
                  loading="eager"
                  sizes="(max-width: 640px) calc(100vw - 72px), 390px"
                  className="object-cover"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="-mx-5 mt-5">
        <nav
          ref={albumRailRef}
          aria-label="Albums"
          className="overflow-x-auto overscroll-x-contain px-5 pb-1 scrollbar-none touch-pan-x"
        >
          <div className="flex w-max min-w-full items-center justify-center gap-2">
            {albums.map((item, index) => {
              const current = index === albumIndex;
              return (
                <button
                  key={item.id}
                  data-album-index={index}
                  type="button"
                  aria-label={`Show ${item.title}`}
                  aria-current={current ? "true" : undefined}
                  onFocus={() => onIntentAlbum(index)}
                  onTouchStart={() => onIntentAlbum(index)}
                  onClick={() => selectAlbum(index)}
                  className={`relative size-11 shrink-0 overflow-hidden rounded-lg border transition-transform duration-base active:scale-95 ${current ? "scale-110" : "opacity-55"}`}
                  style={{
                    borderColor: current
                      ? album.color
                      : "var(--alpha-ffffff-08)",
                    boxShadow: current
                      ? `0 0 18px ${album.color}55`
                      : undefined,
                  }}
                >
                  <Image
                    src={item.cover}
                    alt=""
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </button>
              );
            })}
          </div>
        </nav>
        <div className="mt-3 flex items-center gap-3 px-6 text-[9px] font-medium tracking-[0.12em] text-[var(--palette-6b7280)]">
          <span>ALBUM</span>
          <span className="h-px flex-1 bg-[var(--alpha-ffffff-08)]">
            <i
              className="block h-full transition-[width] duration-slow"
              style={{
                width: `${((albumIndex + 1) / albums.length) * 100}%`,
                backgroundColor: album.color,
              }}
            />
          </span>
          <span>
            {String(albumIndex + 1).padStart(2, "0")} /{" "}
            {String(albums.length).padStart(2, "0")}
          </span>
        </div>
      </div>

      <div key={album.id} className="mobile-album-info-enter">
        <div className="mt-5 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-[var(--palette-9ca3af)]">
              {album.type} · {album.tracks.length} TRACKS
            </p>
            <h1 className="mt-1 flex min-h-10 items-center font-display text-3xl font-semibold leading-none tracking-[-0.04em] text-[var(--color-static-white)]">
              {album.typoLogoUrl ? (
                <TypoLogoMask
                  src={album.typoLogoUrl}
                  label={album.title}
                  className="block h-10 w-full bg-current"
                  style={{
                    WebkitMaskPosition: "left center",
                    maskPosition: "left center",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                  }}
                />
              ) : (
                album.title
              )}
            </h1>
            <p className="mt-2 text-[12px] text-[var(--palette-6b7280)]">
              {artistName} · {album.releaseDate}
            </p>
          </div>
        </div>
      </div>

      <section className="mt-8 border-t border-[var(--alpha-ffffff-08)] pt-6">
        <h2 className="text-sm font-semibold text-[var(--color-static-white)]">
          INTRO
        </h2>
        <p className="mt-3 text-sm font-light leading-6 text-[var(--palette-9ca3af)]">
          {localizeText(album.desc, locale, t.discography.noDescription)}
        </p>
      </section>

      {album.titleImage && (
        <section className="mt-8 border-t border-[var(--alpha-ffffff-08)] pt-6">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-static-white)]">
            {t.discography.tabs.concept}
          </h2>
          <div className="relative aspect-video overflow-hidden rounded-xl border border-[var(--alpha-ffffff-08)]">
            <Image
              src={album.titleImage}
              alt={album.title}
              fill
              sizes="calc(100vw - 40px)"
              className="object-cover"
            />
          </div>
        </section>
      )}

      <section className="mt-8 border-t border-[var(--alpha-ffffff-08)] pt-6">
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-static-white)]">
          {t.discography.tabs.members}
        </h2>
        <MemberGallery
          layout="flow"
          album={album}
          members={members}
          gallery={gallery}
          albumColor={album.color}
        />
      </section>
    </div>
  );
}
