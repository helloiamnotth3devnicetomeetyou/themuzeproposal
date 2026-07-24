"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { LuChevronDown, LuChevronLeft, LuChevronRight, LuHeadphones } from "react-icons/lu";
import { SiSpotify, SiYoutube } from "react-icons/si";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useLocale } from "./context/LocaleContext";
import { getPublicHomeSlides } from "@/features/home/repository";
import { supabase } from "@/lib/supabase";
import type { HomeSlideDTO } from "@/features/home/types";

const TRANSITION_DURATION = 1100;

export default function Home() {
  const { locale, t } = useLocale();
  const [slides, setSlides] = useState<HomeSlideDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [prevSlide, setPrevSlide] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [openStreamingSlideId, setOpenStreamingSlideId] = useState<string | null>(null);

  const [isPageVisible, setIsPageVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const transitionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSlides() {
      setLoading(true);
      setLoadError(false);

      try {
        const nextSlides = await getPublicHomeSlides(supabase);
        if (cancelled) return;
        setSlides(nextSlides);
        setCurrentSlide(0);
        setPrevSlide(null);
        setIsTransitioning(false);
        setOpenStreamingSlideId(null);
      } catch {
        if (cancelled) return;
        setSlides([]);
        setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadSlides();
    return () => {
      cancelled = true;
    };
  }, []);

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

  if (loading || slides.length === 0) {
    return (
      <main className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-black">
        {loading
          ? <LoadingIndicator label="YOU ARE MY MUZE" className="text-white/50" />
          : <div className="text-center"><p className="font-display text-sm font-black text-white/60">YOU ARE MY MUZE</p>{loadError && <p className="mt-4 text-xs text-white/35">Unable to load albums.</p>}</div>}
      </main>
    );
  }

  return (
    <main
      className="relative h-screen w-full overflow-hidden"
      style={{ backgroundColor: "#000" }}
    >
      <h1 className="sr-only">{slides[currentSlide]?.artistName} — {slides[currentSlide]?.title}</h1>
      {slides.map((slide, index) => {
        const isActive = index === currentSlide;
        const isLeaving = index === prevSlide;
        if (!isActive && !isLeaving) return null;

        return (
          <div
            key={slide.id}
            className="absolute inset-0"
            style={{
              zIndex: isActive ? 10 : 5,
              animation: isActive
                ? "slideReveal 1.1s cubic-bezier(0.76, 0, 0.24, 1) forwards"
                : isLeaving
                  ? "slideExit 1.1s cubic-bezier(0.76, 0, 0.24, 1) forwards"
                  : undefined,
            }}
          >
            <div className="absolute inset-x-0 bottom-0 z-10 h-2/5" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" }} />
            <div className="absolute inset-x-0 top-0 z-10 h-32" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 100%)" }} />
            <div className="absolute inset-y-0 left-0 z-10 w-1/3" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.55) 0%, transparent 100%)" }} />

            {slide.imageUrl && (
              <Image
                src={slide.imageUrl}
                alt={`${slide.artistName} ${slide.title}`}
                fill
                sizes="100vw"
                priority={index === 0}
                unoptimized={slide.imageUrl.startsWith("http")}
                className="object-cover object-center"
                style={{
                  animation: isActive ? "kenBurnsIn 6s ease-out forwards" : undefined,
                  transform: isLeaving ? "scale(1.02)" : undefined,
                }}
              />
            )}

            <div className="absolute inset-x-0 bottom-16 z-20 mx-auto flex max-w-7xl items-end justify-between gap-6 px-6 md:bottom-20">
              <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
                <span
                  className="text-sm font-extrabold uppercase text-brand-pink md:text-base"
                  style={{
                    opacity: isActive ? undefined : 0,
                    animation: isActive ? "fadeInUp 0.7s 0.1s cubic-bezier(0.16,1,0.3,1) both" : undefined,
                  }}
                >
                  {slide.artistName} {slide.type}
                </span>
                <h2
                  className="font-hero text-5xl font-black uppercase leading-none tracking-tight drop-shadow-lg md:text-8xl"
                  style={{
                    color: "#ffffff",
                    opacity: isActive ? undefined : 0,
                    animation: isActive ? "textShimmer 1s 0.25s cubic-bezier(0.16,1,0.3,1) both" : undefined,
                  }}
                >
                  {slide.title}
                </h2>
                {slide.descriptions[locale] && (
                  <p
                    className="max-w-lg text-sm font-light leading-relaxed drop-shadow-md md:text-base"
                    style={{
                      color: "rgba(255,255,255,0.80)",
                      opacity: isActive ? undefined : 0,
                      animation: isActive ? "fadeInUp 0.9s 0.5s cubic-bezier(0.16,1,0.3,1) both" : undefined,
                    }}
                  >
                    {slide.descriptions[locale]}
                  </p>
                )}
                <div
                  className="mt-2 flex flex-wrap items-center gap-3"
                  style={{
                    opacity: isActive ? undefined : 0,
                    animation: isActive ? "fadeInUp 0.9s 0.65s cubic-bezier(0.16,1,0.3,1) both" : undefined,
                  }}
                >
                  <a
                    href={`/${slide.artistSlug}/discography?album=${encodeURIComponent(slide.id)}`}
                    className="inline-flex min-h-11 items-center rounded-full bg-brand-pink px-7 text-xs font-black tracking-widest text-black shadow-lg shadow-brand-pink/20 transition-transform duration-300 hover:scale-105 hover:bg-brand-pink/90"
                  >
                    {t.hero.exploreBtn}
                  </a>
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
            className="absolute left-6 top-1/2 z-30 -translate-y-1/2 rounded-full border p-3 transition-all duration-300 hover:bg-brand-pink hover:text-black"
            style={{ backgroundColor: "rgba(0,0,0,0.30)", borderColor: "rgba(255,255,255,0.10)", color: "white" }}
          >
            <LuChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => goToSlide(currentSlide + 1)}
            aria-label="Next album"
            className="absolute right-6 top-1/2 z-30 -translate-y-1/2 rounded-full border p-3 transition-all duration-300 hover:bg-brand-pink hover:text-black"
            style={{ backgroundColor: "rgba(0,0,0,0.30)", borderColor: "rgba(255,255,255,0.10)", color: "white" }}
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
                  className={`h-[3px] rounded-full transition-all duration-500 ${index === currentSlide ? "w-8 bg-brand-pink" : "w-3 group-hover:bg-white/50"}`}
                  style={index !== currentSlide ? { backgroundColor: "rgba(255,255,255,0.30)" } : {}}
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
