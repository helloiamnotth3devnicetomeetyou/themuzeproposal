"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type Dispatch, type SetStateAction } from "react";
import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";
import { useLocale } from "@/core/providers/LocaleContext";
import { localizeText } from "@/core/i18n/localized";
import type { HomeSlideDTO } from "@/public/features/home/types";
import { firstSlideMediaReady, startSlideTransition, swipeSlideOffset } from "./carousel-state";
import HomeSlide from "./HomeSlide";
import HomeSlideControls from "./HomeSlideControls";

const TRANSITION_DURATION = 1100;
const AUTOPLAY_DURATION = 10_000;
const FIRST_VIDEO_READY_TIMEOUT = 4000;

export default function Home({ initialSlides }: { initialSlides: HomeSlideDTO[] }) {
  const { locale, t } = useLocale();
  const [rawSlides] = useState(initialSlides);
  const slides = useMemo(() => rawSlides.map((slide) => ({
    ...slide,
    artistName: localizeText(slide.artistNames, locale, slide.artistName),
    title: localizeText(slide.titles, locale, slide.title),
  })), [locale, rawSlides]);
  const [transition, setTransition] = useState({ current: 0, previous: null as number | null, direction: 1 as -1 | 1 });
  const [openStreamingSlideId, setOpenStreamingSlideId] = useState<string | null>(null);
  const [isFirstImageLoaded, setIsFirstImageLoaded] = useState(!rawSlides[0]?.imageUrl);
  const [readyVideoSlideIds, setReadyVideoSlideIds] = useState<Set<string>>(() => new Set());
  const [failedVideoSlideIds, setFailedVideoSlideIds] = useState<Set<string>>(() => new Set());
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [autoplayElapsed, setAutoplayElapsed] = useState(0);
  const transitionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoplayTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoplayElapsedRef = useRef(0);
  const autoplayStartedAt = useRef<number | null>(null);
  const swipeStartX = useRef<number | null>(null);
  const previousVideoSlide = useRef<number | null>(null);
  const currentSlide = transition.current;
  const prevSlide = transition.previous;
  const nextSlide = slides.length > 1 ? (currentSlide + 1) % slides.length : currentSlide;
  const previousSlideIndex = slides.length > 1 ? (currentSlide - 1 + slides.length) % slides.length : currentSlide;
  const firstSlideReady = firstSlideMediaReady(Boolean(rawSlides[0]?.videoUrl), Boolean(rawSlides[0] && readyVideoSlideIds.has(rawSlides[0].id)), Boolean(rawSlides[0] && failedVideoSlideIds.has(rawSlides[0].id)), isFirstImageLoaded);
  const nextVideoIndex = slides.findIndex((slide, index) => index > 0 && slide.videoUrl && !readyVideoSlideIds.has(slide.id) && !failedVideoSlideIds.has(slide.id));
  const preloadIndex = !firstSlideReady
    ? Math.min(1, Math.max(0, slides.length - 1))
    : nextVideoIndex === -1 ? Math.max(0, slides.length - 1) : nextVideoIndex;

  useEffect(() => () => { if (transitionTimeout.current) clearTimeout(transitionTimeout.current); }, []);
  useEffect(() => {
    const firstSlide = rawSlides[0];
    if (!firstSlide?.videoUrl) return;
    const timeout = setTimeout(() => {
      setReadyVideoSlideIds((current) => current.has(firstSlide.id) ? current : new Set(current).add(firstSlide.id));
    }, FIRST_VIDEO_READY_TIMEOUT);
    return () => clearTimeout(timeout);
  }, [rawSlides]);
  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncViewportPreferences = () => setPrefersReducedMotion(motionQuery.matches);
    const syncVisibility = () => {
      const visible = document.visibilityState === "visible";
      setIsPageVisible(visible);
      if (!visible) document.querySelectorAll<HTMLVideoElement>(".home-hero-video").forEach((video) => video.pause());
    };
    const frame = requestAnimationFrame(() => { syncViewportPreferences(); syncVisibility(); });
    motionQuery.addEventListener("change", syncViewportPreferences);
    document.addEventListener("visibilitychange", syncVisibility);
    return () => { cancelAnimationFrame(frame); motionQuery.removeEventListener("change", syncViewportPreferences); document.removeEventListener("visibilitychange", syncVisibility); };
  }, []);

  const goToSlide = useCallback((next: number) => {
    if (slides.length <= 1 || prevSlide !== null) return;
    const nextTransition = startSlideTransition(currentSlide, next, slides.length);
    if (nextTransition.current === currentSlide) return;
    autoplayElapsedRef.current = 0;
    autoplayStartedAt.current = null;
    setAutoplayElapsed(0);
    setTransition(nextTransition);
    setOpenStreamingSlideId(null);
    if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
    transitionTimeout.current = setTimeout(() => setTransition((current) => ({ ...current, previous: null })), TRANSITION_DURATION);
  }, [currentSlide, prevSlide, slides.length]);

  const goToSlideRef = useRef(goToSlide);
  useEffect(() => { goToSlideRef.current = goToSlide; }, [goToSlide]);
  useEffect(() => {
    document.querySelectorAll<HTMLVideoElement>(".home-hero-video").forEach((video) => {
      const slideIndex = Number(video.dataset.slideIndex);
      const isCurrent = slideIndex === currentSlide;
      if ((!isCurrent && slideIndex !== prevSlide) || !isPageVisible || prefersReducedMotion) return video.pause();
      const playVideo = () => void video.play().catch(() => undefined);
      const startTime = Number(video.dataset.startTime || 0);
      if (isCurrent && previousVideoSlide.current !== currentSlide && Math.abs(video.currentTime - startTime) > 0.1) {
        const onSeeked = () => { video.removeEventListener("seeked", onSeeked); playVideo(); };
        video.addEventListener("seeked", onSeeked);
        video.currentTime = startTime;
        setTimeout(() => { video.removeEventListener("seeked", onSeeked); playVideo(); }, 300);
        return;
      }
      playVideo();
    });
    previousVideoSlide.current = currentSlide;
  }, [currentSlide, isPageVisible, prefersReducedMotion, prevSlide]);
  useEffect(() => {
    if (slides.length <= 1 || !isPageVisible || prefersReducedMotion) return;
    const remaining = Math.max(0, AUTOPLAY_DURATION - autoplayElapsedRef.current);
    autoplayStartedAt.current = performance.now();
    autoplayTimeout.current = setTimeout(() => { autoplayElapsedRef.current = AUTOPLAY_DURATION; setAutoplayElapsed(AUTOPLAY_DURATION); goToSlideRef.current(currentSlide + 1); }, remaining);
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

  if (!slides.length) return <main className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-[var(--bg-base)] transition-colors duration-slow"><div className="text-center"><p className="font-display text-sm font-black text-[var(--text-muted)]">YOU ARE MY MUZE</p><p className="mt-4 text-xs text-[var(--text-faint)]">No featured albums are available.</p></div></main>;

  const progressStyle: CSSProperties = { animation: `homeSlideProgress ${AUTOPLAY_DURATION}ms linear both`, animationDelay: `-${autoplayElapsed}ms`, animationPlayState: isPageVisible && !prefersReducedMotion ? "running" : "paused" };
  const updateVideoStatus = (setStatus: Dispatch<SetStateAction<Set<string>>>) => (id: string) => setStatus((current) => current.has(id) ? current : new Set(current).add(id));

  return <main
    className="relative h-[100dvh] w-full overflow-hidden"
    style={{ backgroundColor: "var(--color-static-black)", touchAction: "pan-y", "--slide-accent": slides[currentSlide]?.color || BRAND_PINK_HEX } as CSSProperties}
    aria-busy={!firstSlideReady}
    onPointerDown={(event) => { if (event.pointerType !== "touch") return; swipeStartX.current = event.clientX; event.currentTarget.setPointerCapture(event.pointerId); }}
    onPointerUp={(event) => { if (swipeStartX.current === null) return; const offset = swipeSlideOffset(swipeStartX.current, event.clientX); swipeStartX.current = null; if (offset) goToSlide(currentSlide + offset); }}
    onPointerCancel={() => { swipeStartX.current = null; }}
  >
    <h1 className="sr-only">{slides[currentSlide]?.artistName} — {slides[currentSlide]?.title}</h1>
    {slides.map((slide, index) => <HomeSlide key={slide.id} slide={slide} index={index} currentSlide={currentSlide} previousSlide={prevSlide} nextSlide={nextSlide} previousSlideIndex={previousSlideIndex} direction={transition.direction} locale={locale} exploreLabel={t.hero.exploreBtn} listenLabel={t.hero.listenBtn} openStreamingSlideId={openStreamingSlideId} readyVideoSlideIds={readyVideoSlideIds} failedVideoSlideIds={failedVideoSlideIds} shouldPreload={index <= preloadIndex} onStreamingToggle={(id) => setOpenStreamingSlideId((current) => current === id ? null : id)} onStreamingClose={() => setOpenStreamingSlideId(null)} onVideoReady={updateVideoStatus(setReadyVideoSlideIds)} onVideoFailure={updateVideoStatus(setFailedVideoSlideIds)} onFirstImageLoaded={() => setIsFirstImageLoaded(true)} />)}
    <HomeSlideControls slides={slides} currentSlide={currentSlide} autoplayElapsed={autoplayElapsed} progressStyle={progressStyle} onSelect={goToSlide} />
  </main>;
}
