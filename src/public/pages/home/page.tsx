"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type SVGProps, type VideoHTMLAttributes } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, Headphones } from "lucide-react";
import LoadingIndicator from "@/core/components/feedback/LoadingIndicator";
import { useLocale } from "@/core/providers/LocaleContext";
import { localizeText } from "@/core/i18n/localized";
import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";
import type { HomeSlideDTO } from "@/public/features/home/types";
import { spotifyAlbumHref } from "@/core/http/spotify";
import { startSlideTransition, swipeSlideOffset } from "./carousel-state";

const TRANSITION_DURATION = 1100;
const AUTOPLAY_DURATION = 10_000;
const RAIL_GAP = 4;
const highPriorityVideo = { fetchpriority: "high" } as unknown as VideoHTMLAttributes<HTMLVideoElement>;

export default function Home({ initialSlides }: { initialSlides: HomeSlideDTO[] }) {
  const { locale, t } = useLocale();
  const [rawSlides] = useState<HomeSlideDTO[]>(initialSlides);
  const slides = useMemo(() => rawSlides.map((slide) => ({
    ...slide,
    artistName: localizeText(slide.artistNames, locale, slide.artistName),
    title: localizeText(slide.titles, locale, slide.title),
  })), [locale, rawSlides]);
  const [transition, setTransition] = useState({ current: 0, previous: null as number | null, direction: 1 as -1 | 1 });
  const currentSlide = transition.current;
  const prevSlide = transition.previous;
  const nextSlide = slides.length > 1 ? (currentSlide + 1) % slides.length : currentSlide;
  const isTransitioning = prevSlide !== null;
  const [openStreamingSlideId, setOpenStreamingSlideId] = useState<string | null>(null);
  const [isFirstImageLoaded, setIsFirstImageLoaded] = useState(!rawSlides[0]?.imageUrl);
  const [readyVideoSlideIds, setReadyVideoSlideIds] = useState<Set<string>>(() => new Set());

  const [isPageVisible, setIsPageVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [autoplayElapsed, setAutoplayElapsed] = useState(0);
  const transitionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoplayTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoplayElapsedRef = useRef(0);
  const autoplayStartedAt = useRef<number | null>(null);
  const swipeStartX = useRef<number | null>(null);
  const previousVideoSlide = useRef<number | null>(null);

  useEffect(() => () => {
    if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
  }, []);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncViewportPreferences = () => {
      setPrefersReducedMotion(motionQuery.matches);
    };
    const syncVisibility = () => {
      const visible = document.visibilityState === "visible";
      setIsPageVisible(visible);
      if (!visible) document.querySelectorAll<HTMLVideoElement>(".home-hero-video").forEach((video) => video.pause());
    };
    const animationFrame = requestAnimationFrame(() => {
      syncViewportPreferences();
      syncVisibility();
    });

    motionQuery.addEventListener("change", syncViewportPreferences);
    document.addEventListener("visibilitychange", syncVisibility);
    return () => {
      cancelAnimationFrame(animationFrame);
      motionQuery.removeEventListener("change", syncViewportPreferences);
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, []);

  const goToSlide = useCallback((next: number) => {
    if (slides.length <= 1 || isTransitioning) return;

    const nextTransition = startSlideTransition(currentSlide, next, slides.length);
    const normalizedNext = nextTransition.current;
    if (normalizedNext === currentSlide) return;

    autoplayElapsedRef.current = 0;
    autoplayStartedAt.current = null;
    setAutoplayElapsed(0);
    setTransition(nextTransition);
    setOpenStreamingSlideId(null);

    if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
    transitionTimeout.current = setTimeout(() => {
      setTransition((current) => ({ ...current, previous: null }));
    }, TRANSITION_DURATION);
  }, [currentSlide, isTransitioning, slides.length]);

  const goToSlideRef = useRef(goToSlide);
  useEffect(() => { goToSlideRef.current = goToSlide; }, [goToSlide]);

  useEffect(() => {
    const videos = [...document.querySelectorAll<HTMLVideoElement>(".home-hero-video")];
    videos.forEach((video) => {
      const slideIndex = Number(video.dataset.slideIndex);
      const isCurrent = slideIndex === currentSlide;
      const isLeaving = slideIndex === prevSlide;
      if ((!isCurrent && !isLeaving) || !isPageVisible || prefersReducedMotion) {
        video.pause();
        return;
      }
      if (isCurrent && previousVideoSlide.current !== currentSlide) video.currentTime = Number(video.dataset.startTime || 0);
      void video.play().catch(() => undefined);
    });
    previousVideoSlide.current = currentSlide;
  }, [currentSlide, isPageVisible, prefersReducedMotion, prevSlide]);

  useEffect(() => {
    if (slides.length <= 1 || !isPageVisible || prefersReducedMotion) return;
    const remaining = Math.max(0, AUTOPLAY_DURATION - autoplayElapsedRef.current);
    autoplayStartedAt.current = performance.now();
    autoplayTimeout.current = setTimeout(() => {
      autoplayElapsedRef.current = AUTOPLAY_DURATION;
      setAutoplayElapsed(AUTOPLAY_DURATION);
      goToSlideRef.current(currentSlide + 1);
    }, remaining);

    return () => {
      if (autoplayTimeout.current !== null) clearTimeout(autoplayTimeout.current);
      if (autoplayStartedAt.current !== null) {
        const elapsed = Math.min(AUTOPLAY_DURATION, autoplayElapsedRef.current + performance.now() - autoplayStartedAt.current);
        autoplayElapsedRef.current = elapsed;
        autoplayStartedAt.current = null;
        setAutoplayElapsed(elapsed);
      }
    };
  }, [currentSlide, isPageVisible, prefersReducedMotion, slides.length]);

  if (slides.length === 0) {
    return (
      <main className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-[var(--bg-base)] transition-colors duration-slow">
        <div className="text-center"><p className="font-display text-sm font-black text-[var(--text-muted)]">YOU ARE MY MUZE</p><p className="mt-4 text-xs text-[var(--text-faint)]">No featured albums are available.</p></div>
      </main>
    );
  }

  const progressStyle: CSSProperties = {
    animation: `homeSlideProgress ${AUTOPLAY_DURATION}ms linear both`,
    animationDelay: `-${autoplayElapsed}ms`,
    animationPlayState: isPageVisible && !prefersReducedMotion ? "running" : "paused",
  };

  return (
    <main
      className="relative h-[100dvh] w-full overflow-hidden"
      style={{ backgroundColor: "var(--color-static-black)", touchAction: "pan-y", "--slide-accent": slides[currentSlide]?.color || BRAND_PINK_HEX } as CSSProperties}
      aria-busy={!isFirstImageLoaded}
      onPointerDown={(event) => {
        if (event.pointerType !== "touch") return;
        swipeStartX.current = event.clientX;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerUp={(event) => {
        if (swipeStartX.current === null) return;
        const offset = swipeSlideOffset(swipeStartX.current, event.clientX);
        swipeStartX.current = null;
        if (offset) goToSlide(currentSlide + offset);
      }}
      onPointerCancel={() => {
        swipeStartX.current = null;
      }}
    >
      <h1 className="sr-only">{slides[currentSlide]?.artistName} — {slides[currentSlide]?.title}</h1>
      {slides.map((slide, index) => {
        const isActive = index === currentSlide;
        const isLeaving = index === prevSlide;
        const isVisible = isActive || isLeaving;
        const shouldLoadMedia = isVisible || index === nextSlide;

        return (
          <div
            key={slide.id}
            className="absolute inset-0"
            aria-hidden={!isActive}
            style={{
              zIndex: isActive ? 10 : isLeaving ? 5 : 0,
              opacity: isVisible ? undefined : 0,
              pointerEvents: isActive ? "auto" : "none",
              animation: isActive
                ? `${transition.direction === 1 ? "slideRevealReverse" : "slideReveal"} 1.1s cubic-bezier(0.76, 0, 0.24, 1) forwards`
                : isLeaving
                  ? `${transition.direction === 1 ? "slideExitReverse" : "slideExit"} 1.1s cubic-bezier(0.76, 0, 0.24, 1) forwards`
                  : undefined,
              "--slide-accent": slide.color || BRAND_PINK_HEX,
            } as CSSProperties}
          >
            <div className="home-hero-shade" aria-hidden="true" />

            {slide.videoUrl && <video
              className="home-hero-video absolute inset-0 z-[1] h-full w-full object-cover"
              src={slide.videoUrl}
              data-slide-index={index}
              data-start-time={videoStartTime(slide.videoUrl)}
              muted
              playsInline
              preload="auto"
              {...(isActive ? highPriorityVideo : {})}
              aria-hidden="true"
              onCanPlay={() => setReadyVideoSlideIds((current) => current.has(slide.id) ? current : new Set(current).add(slide.id))}
              style={{ opacity: readyVideoSlideIds.has(slide.id) ? 1 : 0, transition: "opacity 600ms ease" }}
            />}

            {shouldLoadMedia && slide.imageUrl && (
              <Image
                src={slide.imageUrl}
                alt={`${slide.artistName} ${slide.title}`}
                fill
                sizes="(max-width: 768px) 768px, 100vw"
                preload={isActive}
                fetchPriority={isActive ? "high" : undefined}
                loading="eager"
                quality={80}
                onLoad={() => { if (index === 0) setIsFirstImageLoaded(true); }}
                className="object-cover object-center"
                style={{ animation: isVisible ? "kenBurnsIn 8s ease-out forwards" : undefined }}
              />
            )}
            {index === 0 && !isFirstImageLoaded && <div className="home-hero-loading"><LoadingIndicator label="Loading featured release" /></div>}

            <div className="home-hero-content">
              <div className="home-hero-copy">
                <span className="home-release-meta">
                  <span style={{ color: "var(--slide-accent)" }}>{slide.artistName}</span>
                  {slide.type && (
                    <>
                      <span style={{ color: "var(--alpha-ffffff-3)", margin: "0 0.4em" }}>·</span>
                      <span style={{ color: "var(--color-static-white)" }}>{slide.type}</span>
                    </>
                  )}
                </span>
                <h2 className="home-release-title" aria-label={slide.title}>
                  {slide.typoLogoUrl ? (
                    <span
                      aria-hidden="true"
                      className="home-typo-logo"
                      style={{
                        WebkitMaskImage: `url("${slide.typoLogoUrl}")`,
                        maskImage: `url("${slide.typoLogoUrl}")`,
                      }}
                    />
                  ) : slide.title}
                </h2>
                {localizeText(slide.descriptions, locale) && (
                  <p className="home-release-description">
                    {localizeText(slide.descriptions, locale)}
                  </p>
                )}
                <div
                  className="home-release-actions"
                >
                  <Link
                    href={`/${slide.artistSlug}/discography?album=${encodeURIComponent(slide.id)}`}
                    className="home-primary-link"
                  >
                    {t.hero.exploreBtn}
                  </Link>
                  {(slide.youtubeUrl || slide.spotifyId) && (
                    <div className={`home-stream-actions ${openStreamingSlideId === slide.id ? "is-open" : ""}`}>
                      <button
                        type="button"
                        aria-expanded={openStreamingSlideId === slide.id}
                        aria-controls={`streaming-${slide.id}`}
                        onClick={() => setOpenStreamingSlideId((current) => current === slide.id ? null : slide.id)}
                        className={`home-listen-trigger ${openStreamingSlideId === slide.id ? "is-open" : ""}`}
                      >
                        <span className="home-listen-icon" aria-hidden="true"><Headphones /></span>
                        <span>{t.hero.listenBtn}</span>
                        <ChevronDown className="home-listen-chevron" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label="Close streaming options"
                        onClick={() => setOpenStreamingSlideId(null)}
                        className="home-listen-back"
                      >
                        <ChevronLeft aria-hidden="true" />
                      </button>
                      <div
                        id={`streaming-${slide.id}`}
                        className={`home-stream-platforms ${openStreamingSlideId === slide.id ? "is-open" : ""}`}
                        aria-hidden={openStreamingSlideId !== slide.id}
                      >
                        {slide.youtubeUrl && (
                          <a href={slide.youtubeUrl} target="_blank" rel="noreferrer" aria-label={`${slide.title} on YouTube`} className="is-youtube">
                            <YouTubeIcon aria-hidden="true" />
                            <span>YouTube</span>
                          </a>
                        )}
                        {spotifyAlbumHref(slide.spotifyId) && (
                          <a href={spotifyAlbumHref(slide.spotifyId)} target="_blank" rel="noreferrer" aria-label={`${slide.title} on Spotify`} className="is-spotify">
                            <SpotifyIcon aria-hidden="true" />
                            <span>Spotify</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        );
      })}

      {slides.length > 1 && (
        <>
          <p className="sr-only" aria-live="polite">현재 슬라이드 {currentSlide + 1} / {slides.length}: {slides[currentSlide]?.title}</p>
          <button
            type="button"
            onClick={() => goToSlide(currentSlide - 1)}
            aria-label="Previous album"
            className="home-slide-arrow home-slide-arrow-left"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => goToSlide(currentSlide + 1)}
            aria-label="Next album"
            className="home-slide-arrow home-slide-arrow-right"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="home-slide-index">
            <span className="home-slide-count">
              <b>{String(currentSlide + 1).padStart(2, "0")}</b>
              <i>/</i>
              <span>{String(slides.length).padStart(2, "0")}</span>
            </span>
            <div
              className="home-slide-rail"
            >
              <span
                className="home-slide-highlight"
                aria-hidden="true"
                style={{
                  width: `calc(${100 / slides.length}% - ${(RAIL_GAP * (slides.length - 1)) / slides.length}px)`,
                  left: `calc(${(currentSlide * 100) / slides.length}% + ${(currentSlide * RAIL_GAP) / slides.length}px)`,
                }}
              >
                <i key={`desktop-${currentSlide}-${autoplayElapsed}`} style={progressStyle} />
              </span>
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goToSlide(index)}
                  aria-label={`Show ${slide.title}`}
                  aria-current={index === currentSlide ? "true" : undefined}
                  className={index === currentSlide ? "is-active" : undefined}
                >
                  <span className="home-slide-label">{slide.title}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
}

function videoStartTime(videoUrl: string) {
  const match = new URL(videoUrl).hash.match(/^#t=([\d.]+)/);
  const start = Number(match?.[1]);
  return Number.isFinite(start) && start >= 0 ? start : 0;
}

function YouTubeIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" className={className} {...props}><path fill="currentColor" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8Z" /><path fill="var(--color-static-black)" d="m9.6 15.8 6.2-3.8-6.2-3.8v7.6Z" /></svg>;
}

function SpotifyIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" className={className} {...props}><circle cx="12" cy="12" r="10" fill="currentColor" /><path d="M6.7 9.8c3.5-1 7.3-.6 10.4 1M7.3 13c3-0.8 6.3-.5 9 1M8 16c2.5-.6 5.1-.3 7.2.9" stroke="var(--color-static-black)" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}
