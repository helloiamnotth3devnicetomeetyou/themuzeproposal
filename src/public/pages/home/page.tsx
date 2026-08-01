"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { LuChevronDown, LuChevronLeft, LuChevronRight, LuHeadphones } from "react-icons/lu";
import { SiSpotify, SiYoutube } from "react-icons/si";
import { useLocale } from "@/core/providers/LocaleContext";
import { localizeText } from "@/core/i18n/localized";
import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";
import type { HomeSlideDTO } from "@/public/features/home/types";

const TRANSITION_DURATION = 1100;

export default function Home({ initialSlides }: { initialSlides: HomeSlideDTO[] }) {
  const { locale, t } = useLocale();
  const [rawSlides] = useState<HomeSlideDTO[]>(initialSlides);
  const slides = useMemo(() => rawSlides.map((slide) => ({
    ...slide,
    artistName: localizeText(slide.artistNames, locale, slide.artistName),
    title: localizeText(slide.titles, locale, slide.title),
  })), [locale, rawSlides]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [prevSlide, setPrevSlide] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [openStreamingSlideId, setOpenStreamingSlideId] = useState<string | null>(null);

  const [isPageVisible, setIsPageVisible] = useState(true);
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

    const normalizedNext = (next + slides.length) % slides.length;
    if (normalizedNext === currentSlide) return;

    setIsTransitioning(true);
    setPrevSlide(currentSlide);
    setCurrentSlide(normalizedNext);
    setOpenStreamingSlideId(null);

    if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
    transitionTimeout.current = setTimeout(() => {
      setPrevSlide(null);
      setIsTransitioning(false);
    }, TRANSITION_DURATION);
  }, [currentSlide, isTransitioning, slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || isTransitioning || !isPageVisible || prefersReducedMotion) return;

    const timer = setTimeout(() => {
      goToSlide(currentSlide + 1);
    }, 6000);

    return () => clearTimeout(timer);
  }, [currentSlide, goToSlide, isPageVisible, isTransitioning, prefersReducedMotion, slides.length]);

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
            <div className="absolute inset-x-0 bottom-0 z-10 h-2/5" style={{ background: "linear-gradient(to top, var(--alpha-000000-85) 0%, var(--alpha-000000-2) 60%, transparent 100%)" }} />
            <div className="absolute inset-x-0 top-0 z-10 h-32" style={{ background: "linear-gradient(to bottom, var(--alpha-000000-45) 0%, transparent 100%)" }} />
            <div className="absolute inset-y-0 left-0 z-10 w-1/3" style={{ background: "linear-gradient(to right, var(--alpha-000000-55) 0%, transparent 100%)" }} />

            {slide.imageUrl && (
              <Image
                src={slide.imageUrl}
                alt={`${slide.artistName} ${slide.title}`}
                fill
                sizes="100vw"
                preload={index === 0}
                fetchPriority={index === 0 ? "high" : undefined}
                loading={index === 0 ? undefined : "lazy"}
                quality={80}
                className="object-cover object-center"
                style={{
                  animation: isVisible ? "kenBurnsIn 6s ease-out forwards" : undefined,
                }}
              />
            )}

            <div className="absolute inset-x-0 bottom-16 z-20 mx-auto flex max-w-7xl items-end justify-between gap-6 px-6 md:bottom-20">
              <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
                <span
                  className="text-xs font-medium uppercase tracking-wider"
                  style={{
                    opacity: isActive ? undefined : 0,
                    animation: isActive ? "fadeInUp 0.7s 0.1s cubic-bezier(0.16,1,0.3,1) both" : undefined,
                  }}
                >
                  <span style={{ color: "var(--slide-accent)" }}>{slide.artistName}</span>
                  {slide.type && (
                    <>
                      <span style={{ color: "var(--alpha-ffffff-3)", margin: "0 0.4em" }}>·</span>
                      <span style={{ color: "var(--color-static-white)" }}>{slide.type}</span>
                    </>
                  )}
                </span>
                <h2
                  className="font-hero text-5xl font-black uppercase leading-none tracking-tight drop-shadow-lg md:text-8xl"
                  aria-label={slide.title}
                  style={{
                    color: "var(--color-static-white)",
                    opacity: isActive ? undefined : 0,
                    animation: isActive ? "textShimmer 1s 0.25s cubic-bezier(0.16,1,0.3,1) both" : undefined,
                  }}
                >
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
                  <p
                    className="max-w-lg text-sm font-light leading-relaxed drop-shadow-md md:text-base"
                    style={{
                      color: "var(--alpha-ffffff-8)",
                      opacity: isActive ? undefined : 0,
                      animation: isActive ? "fadeInUp 0.9s 0.5s cubic-bezier(0.16,1,0.3,1) both" : undefined,
                    }}
                  >
                    {localizeText(slide.descriptions, locale)}
                  </p>
                )}
                <div
                  className="mt-2 flex flex-wrap items-center gap-3"
                  style={{
                    opacity: isActive ? undefined : 0,
                    animation: isActive ? "fadeInUp 0.9s 0.65s cubic-bezier(0.16,1,0.3,1) both" : undefined,
                  }}
                >
                  <Link
                    href={`/${slide.artistSlug}/discography?album=${encodeURIComponent(slide.id)}`}
                    className="inline-flex min-h-11 items-center rounded-full bg-[var(--slide-accent)] px-7 text-xs font-black tracking-widest text-[var(--color-static-black)] shadow-lg transition-transform duration-slow hover:scale-105 hover:brightness-90"
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
                        <span className="home-listen-icon" aria-hidden="true"><LuHeadphones /></span>
                        <span>{t.hero.listenBtn}</span>
                        <LuChevronDown className="home-listen-chevron" aria-hidden="true" />
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
                        {slide.spotifyId && (
                          <a href={`https://open.spotify.com/album/${slide.spotifyId}`} target="_blank" rel="noreferrer" aria-label={`${slide.title} on Spotify`} className="is-spotify">
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
            className="absolute left-6 top-1/2 z-30 -translate-y-1/2 rounded-full border p-3 transition-all duration-slow hover:bg-[var(--slide-accent)] hover:text-[var(--color-static-black)]"
            style={{ backgroundColor: "var(--alpha-000000-3)", borderColor: "var(--alpha-ffffff-1)", color: "var(--color-static-white)" }}
          >
            <LuChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => goToSlide(currentSlide + 1)}
            aria-label="Next album"
            className="absolute right-6 top-1/2 z-30 -translate-y-1/2 rounded-full border p-3 transition-all duration-slow hover:bg-[var(--slide-accent)] hover:text-[var(--color-static-black)]"
            style={{ backgroundColor: "var(--alpha-000000-3)", borderColor: "var(--alpha-ffffff-1)", color: "var(--color-static-white)" }}
          >
            <LuChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="absolute bottom-6 right-6 z-30 flex items-center gap-3">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goToSlide(index)}
                aria-label={`Show ${slide.title}`}
                aria-current={index === currentSlide ? "true" : undefined}
                className="group grid h-11 min-w-11 place-items-center"
              >
                <span
                  className={`h-[3px] rounded-full transition-all duration-500 ${index === currentSlide ? "w-8" : "w-3 group-hover:bg-[var(--alpha-ffffff-5)]"}`}
                  style={{ backgroundColor: index === currentSlide ? "var(--slide-accent)" : "var(--alpha-ffffff-3)" }}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
