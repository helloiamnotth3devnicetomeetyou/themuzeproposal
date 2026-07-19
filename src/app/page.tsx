"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useLocale } from "./context/LocaleContext";
import { supabase } from "@/lib/supabase";

const FALLBACK_SLIDES = [
  { img: "/images/hero_1.png", spotifyId: "5fooRwtJmNvt64WhLN5Chy" }, // Pretty Girl
  { img: "/images/hero_2.png", spotifyId: "6wL6HetMdQwsTqZzCBpGGJ" }, // Runaway
  { img: "/images/hero_3.png", spotifyId: "3H7MTJVprjcvlvCeQdRe1H" }, // Lip Bomb
  { img: "/images/hero_4.png", spotifyId: "0Ka3xa6oOWmW1hIjjjxEW0" }, // Glow Up
  { img: "/images/hero_5.png", spotifyId: "0msC9kyzmtznRwIxwafISH" }, // SCENEDROME (Syndrome)
];

export default function Home() {
  const { t } = useLocale();
  const [slides, setSlides] = useState(FALLBACK_SLIDES);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [prevSlide, setPrevSlide] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    supabase.from("hero_slides").select("image_url, spotify_id, sort_order").eq("is_active", true).order("sort_order")
      .then(({ data }) => {
        if (data?.length) setSlides(data.map((slide) => ({ img: slide.image_url, spotifyId: slide.spotify_id || "" })));
      });
  }, []);

  const goToSlide = (next: number) => {
    if (isTransitioning || next === currentSlide) return;
    setIsTransitioning(true);
    setPrevSlide(currentSlide);
    setCurrentSlide(next);
    setTimeout(() => {
      setPrevSlide(null);
      setIsTransitioning(false);
    }, 1100);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % slides.length;
        setPrevSlide(prev);
        setIsTransitioning(true);
        setTimeout(() => { setPrevSlide(null); setIsTransitioning(false); }, 1100);
        return next;
      });
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative h-screen w-full overflow-hidden" style={{ backgroundColor: "#000" }}>

      {slides.map(({ img, spotifyId }, index) => {
        const isActive = index === currentSlide;
        const isLeaving = index === prevSlide;
        if (!isActive && !isLeaving) return null;

        return (
          <div
            key={index}
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
            {/* Overlays */}
            <div className="absolute inset-x-0 bottom-0 h-2/5 z-10" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" }} />
            <div className="absolute inset-x-0 top-0 h-32 z-10" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 100%)" }} />
            <div className="absolute inset-y-0 left-0 w-1/3 z-10" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.55) 0%, transparent 100%)" }} />

            {/* Image — Ken Burns */}
            <Image
              src={img}
              alt="THE MUZE Hero Image"
              fill
              sizes="100vw"
              priority={index === 0}
              className="object-cover object-center"
              style={{
                animation: isActive ? "kenBurnsIn 6s ease-out forwards" : undefined,
                transform: isLeaving ? "scale(1.02)" : undefined,
              }}
            />

            {/* Bottom content row: text left · spotify right */}
            <div className="absolute inset-x-0 bottom-16 md:bottom-20 z-20 max-w-7xl mx-auto px-6 flex items-end justify-between gap-6">

              {/* Left: slide text */}
              <div className="flex flex-col items-start gap-3 flex-1 min-w-0">
                <span
                  className="text-brand-pink text-sm md:text-base font-extrabold tracking-[0.3em] uppercase"
                  style={{
                    opacity: isActive ? undefined : 0,
                    animation: isActive ? "fadeInUp 0.7s 0.1s cubic-bezier(0.16,1,0.3,1) both" : undefined,
                  }}
                >
                  {t.hero.slides[index].subtitle}
                </span>
                <h2
                  className="text-5xl md:text-8xl font-black tracking-tight leading-none drop-shadow-lg font-display"
                  style={{
                    color: "#ffffff",
                    opacity: isActive ? undefined : 0,
                    animation: isActive ? "textShimmer 1s 0.25s cubic-bezier(0.16,1,0.3,1) both" : undefined,
                  }}
                >
                  {t.hero.slides[index].title}
                </h2>
                <p
                  className="max-w-lg text-sm md:text-base leading-relaxed font-light drop-shadow-md"
                  style={{
                    color: "rgba(255,255,255,0.80)",
                    opacity: isActive ? undefined : 0,
                    animation: isActive ? "fadeInUp 0.9s 0.5s cubic-bezier(0.16,1,0.3,1) both" : undefined,
                  }}
                >
                  {t.hero.slides[index].desc}
                </p>
                <div
                  className="flex gap-3 mt-2"
                  style={{
                    opacity: isActive ? undefined : 0,
                    animation: isActive ? "fadeInUp 0.9s 0.65s cubic-bezier(0.16,1,0.3,1) both" : undefined,
                  }}
                >
                  <a
                    href="/rescene/artist"
                    className="bg-brand-pink hover:bg-brand-pink/90 text-black px-7 py-3 rounded-full text-xs font-black tracking-widest transition-transform duration-300 hover:scale-105 shadow-lg shadow-brand-pink/20"
                  >
                    {t.hero.exploreBtn}
                  </a>
                  <a
                    href="/rescene/discography"
                    className="px-7 py-3 rounded-full text-xs font-black tracking-widest transition-all duration-300"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.30)",
                      color: "#ffffff",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.15)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.08)"; }}
                  >
                    {t.hero.listenBtn}
                  </a>
                </div>
              </div>

              {/* Right: Spotify compact player */}
              <div
                className="hidden md:block shrink-0"
                style={{
                  opacity: isActive ? undefined : 0,
                  animation: isActive ? "fadeInUp 0.9s 0.8s cubic-bezier(0.16,1,0.3,1) both" : undefined,
                  width: "300px",
                }}
              >
                {/* label */}
                <div className="flex items-center gap-2 mb-2">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="#1DB954">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.45)" }}>
                    NOW STREAMING
                  </span>
                </div>
                {isActive && (
                  <iframe
                    key={`spotify-${index}`}
                    src={`https://open.spotify.com/embed/album/${spotifyId}?utm_source=generator&theme=0`}
                    width="300"
                    height="80"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    style={{
                      borderRadius: "10px",
                      display: "block",
                      border: "none",
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Prev/Next */}
      <button
        onClick={() => goToSlide((currentSlide - 1 + slides.length) % slides.length)}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-30 hover:bg-brand-pink hover:text-black p-3 rounded-full border transition-all duration-300"
        style={{ backgroundColor: "rgba(0,0,0,0.30)", borderColor: "rgba(255,255,255,0.10)", color: "white" }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={() => goToSlide((currentSlide + 1) % slides.length)}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-30 hover:bg-brand-pink hover:text-black p-3 rounded-full border transition-all duration-300"
        style={{ backgroundColor: "rgba(0,0,0,0.30)", borderColor: "rgba(255,255,255,0.10)", color: "white" }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Indicators */}
      <div className="absolute right-6 bottom-6 z-30 flex items-center gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-[3px] rounded-full transition-all duration-500 ${
              index === currentSlide ? "w-8 bg-brand-pink" : "w-3 hover:bg-white/50"
            }`}
            style={index !== currentSlide ? { backgroundColor: "rgba(255,255,255,0.30)" } : {}}
          />
        ))}
      </div>
    </section>
  );
}
