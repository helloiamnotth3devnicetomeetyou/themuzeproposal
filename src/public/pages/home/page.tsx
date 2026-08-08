"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, Headphones } from "lucide-react";
import { SiSpotify, SiYoutube } from "react-icons/si";
import { useLocale } from "@/core/providers/LocaleContext";
import { localizeText } from "@/core/i18n/localized";
import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";
import type { HomeSlideDTO } from "@/public/features/home/types";
import { spotifyAlbumHref } from "@/core/http/spotify";
import { startSlideTransition } from "./carousel-state";

const TRANSITION_DURATION = 1100;

export default function Home({ initialSlides }: { initialSlides: HomeSlideDTO[] }) {
  const { locale, t } = useLocale();
  const [rawSlides] = useState<HomeSlideDTO[]>(initialSlides);
  const slides = useMemo(() => rawSlides.map((slide) => ({
    ...slide,
    artistName: localizeText(slide.artistNames, locale, slide.artistName),
    title: localizeText(slide.titles, locale, slide.title),
  })), [locale, rawSlides]);
  const [transition, setTransition] = useState({ current: 0, previous: null as number | null });
  const currentSlide = transition.current;
  const prevSlide = transition.previous;
  const isTransitioning = prevSlide !== null;
  const [openStreamingSlideId, setOpenStreamingSlideId] = useState<string | null>(null);

  const [isPageVisible, setIsPageVisible] = useState(true);
  const [isInteractionPaused, setIsInteractionPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const transitionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
  }, []);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncViewportPreferences = () => {
      setPrefersReducedMotion(motionQuery.matches);
    };
    const syncVisibility = () => setIsPageVisible(document.visibilityState === "visible");
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

    const normalizedNext = startSlideTransition(currentSlide, next, slides.length).current;
    if (normalizedNext === currentSlide) return;

    setTransition({ current: normalizedNext, previous: currentSlide });
    setOpenStreamingSlideId(null);

    if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
    transitionTimeout.current = setTimeout(() => {
      setTransition((current) => ({ ...current, previous: null }));
    }, TRANSITION_DURATION);
  }, [currentSlide, isTransitioning, slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || isTransitioning || !isPageVisible || isInteractionPaused || prefersReducedMotion) return;

    const timer = setTimeout(() => {
      goToSlide(currentSlide + 1);
    }, 6000);

    return () => clearTimeout(timer);
  }, [currentSlide, goToSlide, isInteractionPaused, isPageVisible, isTransitioning, prefersReducedMotion, slides.length]);

  if (slides.length === 0) {
    return (
      <main className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[var(--bg-base)] transition-colors duration-slow">
        <div className="text-center"><p className="font-display text-sm font-black text-[var(--text-muted)]">YOU ARE MY MUZE</p><p className="mt-4 text-xs text-[var(--text-faint)]">No featured albums are available.</p></div>
      </main>
    );
  }

  return (
    <main
      className="relative h-screen w-full overflow-hidden"
      style={{ backgroundColor: "var(--color-static-black)", "--slide-accent": slides[currentSlide]?.color || BRAND_PINK_HEX } as CSSProperties}
      onFocusCapture={() => setIsInteractionPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsInteractionPaused(false);
      }}
    >
      <h1 className="sr-only">{slides[currentSlide]?.artistName} — {slides[currentSlide]?.title}</h1>
      {slides.map((slide, index) => {
        const isActive = index === currentSlide;
        const isLeaving = index === prevSlide;
        const isVisible = isActive || isLeaving;

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
                ? "slideReveal 1.1s cubic-bezier(0.76, 0, 0.24, 1) forwards"
                : isLeaving
                  ? "slideExit 1.1s cubic-bezier(0.76, 0, 0.24, 1) forwards"
                  : undefined,
              "--slide-accent": slide.color || BRAND_PINK_HEX,
            } as CSSProperties}
          >
            <div className="home-hero-shade" aria-hidden="true" />

            {slide.imageUrl && (
              <Image
                src={slide.imageUrl}
                alt={`${slide.artistName} ${slide.title}`}
                fill
                sizes="(max-width: 768px) 768px, 100vw"
                preload={index === 0}
                fetchPriority={index === 0 ? "high" : undefined}
                loading={index === 0 ? "eager" : "lazy"}
                quality={80}
                className="object-cover object-center"
                style={{ animation: isVisible ? "kenBurnsIn 8s ease-out forwards" : undefined }}
              />
            )}

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
                  onMouseEnter={() => setIsInteractionPaused(true)}
                  onMouseLeave={() => setIsInteractionPaused(false)}
                >
                  <Link
                    href={`/${slide.artistSlug}/discography?album=${encodeURIComponent(slide.id)}`}
                    className="home-primary-link"
                  >
                    {t.hero.exploreBtn}
                  </Link>
                  {(slide.youtubeUrl || slide.spotifyId) && (
                    <div className="home-stream-actions">
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
                      <div
                        id={`streaming-${slide.id}`}
                        className={`home-stream-platforms ${openStreamingSlideId === slide.id ? "is-open" : ""}`}
                        aria-hidden={openStreamingSlideId !== slide.id}
                      >
                        {slide.youtubeUrl && (
                          <a href={slide.youtubeUrl} target="_blank" rel="noreferrer" aria-label={`${slide.title} on YouTube`} className="is-youtube">
                            <SiYoutube aria-hidden="true" />
                            <span>YouTube</span>
                          </a>
                        )}
                        {spotifyAlbumHref(slide.spotifyId) && (
                          <a href={spotifyAlbumHref(slide.spotifyId)} target="_blank" rel="noreferrer" aria-label={`${slide.title} on Spotify`} className="is-spotify">
                            <SiSpotify aria-hidden="true" />
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
            <div className="home-slide-rail">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goToSlide(index)}
                  aria-label={`Show ${slide.title}`}
                  aria-current={index === currentSlide ? "true" : undefined}
                  className={index === currentSlide ? "is-active" : undefined}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
