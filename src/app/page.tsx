"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { SiSpotify, SiYoutube } from "react-icons/si";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useLocale } from "./context/LocaleContext";
import { supabase } from "@/lib/supabase";

type HomeSlide = {
  id: string;
  artistName: string;
  artistSlug: string;
  title: string;
  type: string;
  imageUrl: string;
  spotifyId: string | null;
  youtubeUrl: string | null;
  descriptions: {
    ko: string;
    en: string;
    ja: string;
  };
};

type AlbumRow = {
  id: string;
  artist_id: string;
  title: string;
  type: string;
  cover_url: string | null;
  hero_image_url: string | null;
  spotify_id: string | null;
  youtube_url: string | null;
  description_ko: string | null;
  description_en: string | null;
  description_ja: string | null;
};

type ArtistRow = {
  id: string;
  name: string;
  slug: string;
};

type HeroSlideRow = {
  id: string;
  album_id: string;
  sort_order: number;
};

const HOME_SLIDE_LIMIT = 5;
const TRANSITION_DURATION = 1100;

export default function Home() {
  const { locale, t } = useLocale();
  const [slides, setSlides] = useState<HomeSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [prevSlide, setPrevSlide] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [openStreamingSlideId, setOpenStreamingSlideId] = useState<string | null>(null);
  const transitionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSlides() {
      setLoading(true);
      setLoadError(false);

      const { data: heroSlides, error: heroError } = await supabase
        .from("home_hero_slides")
        .select("id, album_id, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(HOME_SLIDE_LIMIT);

      if (cancelled) return;

      if (heroError) {
        setSlides([]);
        setLoadError(true);
        setLoading(false);
        return;
      }

      const configuredSlides = (heroSlides ?? []) as HeroSlideRow[];
      const albumIds = configuredSlides.map((slide) => slide.album_id);

      if (!albumIds.length) {
        setSlides([]);
        setCurrentSlide(0);
        setPrevSlide(null);
        setIsTransitioning(false);
        setOpenStreamingSlideId(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("albums")
        .select("id, artist_id, title, type, cover_url, hero_image_url, spotify_id, youtube_url, description_ko, description_en, description_ja")
        .in("id", albumIds)
        .eq("is_published", true)
        .lte("published_at", new Date().toISOString());

      if (cancelled) return;

      if (error) {
        setSlides([]);
        setLoadError(true);
      } else {
        const albumsById = new Map(((data ?? []) as AlbumRow[]).map((album) => [album.id, album]));
        const artistIds = [...new Set((data ?? []).map((album) => (album as AlbumRow).artist_id))];
        const { data: artistData, error: artistError } = artistIds.length
          ? await supabase.from("artists").select("id, name, slug").in("id", artistIds).eq("is_active", true)
          : { data: [], error: null };

        if (cancelled) return;
        if (artistError) {
          setSlides([]);
          setLoadError(true);
          setLoading(false);
          return;
        }

        const artistsById = new Map(((artistData ?? []) as ArtistRow[]).map((artist) => [artist.id, artist]));
        setSlides(configuredSlides.flatMap((heroSlide) => {
          const album = albumsById.get(heroSlide.album_id);
          const artist = album ? artistsById.get(album.artist_id) : null;
          if (!album || !artist) return [];
          return [{
          id: album.id,
          artistName: artist.name,
          artistSlug: artist.slug,
          title: album.title,
          type: album.type,
          imageUrl: album.hero_image_url || album.cover_url || "",
          spotifyId: album.spotify_id,
          youtubeUrl: album.youtube_url || null,
          descriptions: {
            ko: album.description_ko ?? "",
            en: album.description_en ?? album.description_ko ?? "",
            ja: album.description_ja ?? album.description_en ?? album.description_ko ?? "",
          },
          }];
        }));
        setCurrentSlide(0);
        setPrevSlide(null);
        setIsTransitioning(false);
        setOpenStreamingSlideId(null);
      }

      setLoading(false);
    }

    void loadSlides();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => () => {
    if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
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
    if (slides.length <= 1 || isTransitioning) return;

    const timer = setTimeout(() => {
      goToSlide(currentSlide + 1);
    }, 6000);

    return () => clearTimeout(timer);
  }, [currentSlide, goToSlide, isTransitioning, slides.length]);

  if (loading || slides.length === 0) {
    return (
      <section className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-black">
        {loading
          ? <LoadingIndicator label="YOU ARE MY MUZE" className="text-white/50" />
          : <div className="text-center"><p className="font-display text-sm font-black tracking-[0.35em] text-white/60">YOU ARE MY MUZE</p>{loadError && <p className="mt-4 text-xs text-white/35">Unable to load albums.</p>}</div>}
      </section>
    );
  }

  return (
    <section className="relative h-screen w-full overflow-hidden" style={{ backgroundColor: "#000" }}>
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
                  className="text-sm font-extrabold uppercase tracking-[0.3em] text-brand-pink md:text-base"
                  style={{
                    opacity: isActive ? undefined : 0,
                    animation: isActive ? "fadeInUp 0.7s 0.1s cubic-bezier(0.16,1,0.3,1) both" : undefined,
                  }}
                >
                  {slide.artistName} {slide.type}
                </span>
                <h2
                  className="font-display text-5xl font-black uppercase leading-none tracking-tight drop-shadow-lg md:text-8xl"
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
                    className="rounded-full bg-brand-pink px-7 py-3 text-xs font-black tracking-widest text-black shadow-lg shadow-brand-pink/20 transition-transform duration-300 hover:scale-105 hover:bg-brand-pink/90"
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
                        className="rounded-full px-7 py-3 text-xs font-black tracking-widest transition-all duration-300"
                        style={{
                          backgroundColor: openStreamingSlideId === slide.id ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.30)",
                          color: "#ffffff",
                        }}
                        onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)"; }}
                        onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = openStreamingSlideId === slide.id ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)"; }}
                      >
                        {t.hero.listenBtn}
                      </button>
                      <div
                        id={`streaming-${slide.id}`}
                        className={`home-stream-platforms ${openStreamingSlideId === slide.id ? "is-open" : ""}`}
                        aria-hidden={openStreamingSlideId !== slide.id}
                      >
                        {slide.youtubeUrl && (
                          <a href={slide.youtubeUrl} target="_blank" rel="noreferrer" aria-label={`${slide.title} on YouTube`} className="is-youtube">
                            <SiYoutube aria-hidden="true" />
                          </a>
                        )}
                        {slide.spotifyId && (
                          <a href={`https://open.spotify.com/album/${slide.spotifyId}`} target="_blank" rel="noreferrer" aria-label={`${slide.title} on Spotify`} className="is-spotify">
                            <SiSpotify aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {slide.spotifyId && (
                <div
                  className="hidden shrink-0 md:block"
                  style={{
                    opacity: isActive ? undefined : 0,
                    animation: isActive ? "fadeInUp 0.9s 0.8s cubic-bezier(0.16,1,0.3,1) both" : undefined,
                    width: "300px",
                  }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <SiSpotify className="h-3.5 w-3.5 shrink-0 text-[#1DB954]" aria-hidden="true" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.45)" }}>
                      NOW STREAMING
                    </span>
                  </div>
                  {isActive && (
                    <iframe
                      key={`spotify-${slide.id}`}
                      title={`${slide.title} on Spotify`}
                      src={`https://open.spotify.com/embed/album/${slide.spotifyId}?utm_source=generator&theme=0`}
                      width="300"
                      height="80"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      style={{ borderRadius: "10px", display: "block", border: "none" }}
                    />
                  )}
                </div>
              )}
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
                className={`h-[3px] rounded-full transition-all duration-500 ${
                  index === currentSlide ? "w-8 bg-brand-pink" : "w-3 hover:bg-white/50"
                }`}
                style={index !== currentSlide ? { backgroundColor: "rgba(255,255,255,0.30)" } : {}}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
