"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useLocale } from "../../context/LocaleContext";
import { supabase } from "@/lib/supabase";

interface Track {
  title: string;
  duration: number | null;
  isTitle: boolean;
  spotifyUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  logoUrl?: string;
}

interface RawDiscographyAlbum {
  id: string; title: string; type: string; release_date: string | null; cover_url: string; color: string | null;
  description_ko: string | null; description_en: string | null; description_ja: string | null;
  spotify_id: string | null; youtube_url: string | null;
  tracks: Array<{ title: string; track_number: number; duration: number | null; is_title: boolean; spotify_url: string | null; audio_url: string | null; music_video_url: string | null; logo_url: string | null }>;
}

interface Album {
  id: string;
  title: string;
  type: string;
  releaseDate: string;
  cover: string;
  tracks: Track[];
  color: string;
  desc: { ko: string; en: string; ja: string };
  conceptPhoto?: string;
  links?: { youtube?: string; spotify?: string };
}

export default function Discography() {
  const { locale } = useLocale();
  const { artistid } = useParams<{ artistid: string }>();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artistName, setArtistName] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [albumIndex, setAlbumIndex] = useState(0);
  const [showDiscs, setShowDiscs] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
  const [hoveredDisc, setHoveredDisc] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"concept" | "intro" | "members">("intro");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const album = albums[albumIndex];

  useEffect(() => {
    let cancelled = false;

    async function loadDiscography() {
      setLoading(true);
      setLoadError(null);
      setAlbums([]);
      setArtistName("");
      setAlbumIndex(0);

      const { data: artist, error: artistError } = await supabase
        .from("artists")
        .select("id,name")
        .eq("slug", artistid)
        .maybeSingle();

      if (artistError || !artist) {
        if (!cancelled) {
          setLoadError(artistError ? "아티스트 정보를 불러오지 못했습니다." : "존재하지 않는 아티스트입니다.");
          setLoading(false);
        }
        return;
      }

      const albumsResult = await supabase
        .from("albums")
        .select("id,title,type,release_date,cover_url,color,description_ko,description_en,description_ja,spotify_id,youtube_url,tracks(title,track_number,duration,is_title,spotify_url,audio_url,music_video_url,logo_url)")
        .eq("artist_id", artist.id)
        .eq("is_published", true)
        .lte("published_at", new Date().toISOString())
        .order("sort_order", { ascending: true });

      if (cancelled) return;
      if (albumsResult.error) {
        setLoadError("디스코그래피를 불러오지 못했습니다.");
      } else {
        setArtistName(artist.name || artistid.toUpperCase());
        setAlbums(((albumsResult.data ?? []) as unknown as RawDiscographyAlbum[]).map((item) => ({
          id: item.id,
          title: item.title,
          type: item.type,
          releaseDate: item.release_date ?? "",
          cover: item.cover_url,
          color: item.color || "#FC6FCF",
          tracks: (item.tracks || []).sort((a: { track_number: number }, b: { track_number: number }) => a.track_number - b.track_number).map((track: { title: string; duration: number | null; is_title: boolean; spotify_url: string | null; audio_url: string | null; music_video_url: string | null; logo_url: string | null }) => ({
            title: track.title,
            duration: track.duration,
            isTitle: track.is_title,
            spotifyUrl: track.spotify_url || undefined,
            audioUrl: track.audio_url || undefined,
            videoUrl: track.music_video_url || undefined,
            logoUrl: track.logo_url || undefined,
          })),
          desc: { ko: item.description_ko || "", en: item.description_en || "", ja: item.description_ja || "" },
          links: { spotify: item.spotify_id ? `https://open.spotify.com/album/${item.spotify_id}` : undefined, youtube: item.youtube_url || undefined },
        })));
      }
      setLoading(false);
    }

    void loadDiscography();
    return () => { cancelled = true; };
  }, [artistid]);

  // Smooth album switch
  const switchAlbum = useCallback((newIndex: number) => {
    if (newIndex === albumIndex || transitioning) return;
    setSlideDir(newIndex > albumIndex ? "left" : "right");
    setTransitioning(true);
    setShowDiscs(false);
    setIsPlaying(false);

    setTimeout(() => {
      setAlbumIndex(newIndex);
      setCurrentTrackIndex(0);
      setProgress(0);
      setSlideDir(null);
      setActiveTab("intro");

      requestAnimationFrame(() => {
        setTransitioning(false);
      });
    }, 350);
  }, [albumIndex, transitioning]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") switchAlbum(Math.min(albumIndex + 1, albums.length - 1));
      if (e.key === "ArrowLeft") switchAlbum(Math.max(albumIndex - 1, 0));
      if (e.key === " " && album?.tracks[currentTrackIndex]?.audioUrl) { e.preventDefault(); setIsPlaying((p) => !p); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [albumIndex, switchAlbum, albums.length, album, currentTrackIndex]);

  // Real MP3 playback with a visual fallback for legacy tracks without audio.
  useEffect(() => {
    const audio = audioRef.current;
    const source = album?.tracks[currentTrackIndex]?.audioUrl;
    if (!audio || !source) return;
    if (audio.src !== source) { audio.src = source; audio.load(); }
    if (isPlaying) void audio.play().catch(() => setIsPlaying(false));
    else audio.pause();
  }, [isPlaying, currentTrackIndex, album]);

  const playTrack = (idx: number) => { setCurrentTrackIndex(idx); setProgress(0); setIsPlaying(Boolean(album.tracks[idx]?.audioUrl)); };
  const togglePlay = () => { if (album.tracks[currentTrackIndex]?.audioUrl) setIsPlaying(!isPlaying); };
  const handleNext = () => { const next = (currentTrackIndex + 1) % album.tracks.length; setProgress(0); setCurrentTrackIndex(next); setIsPlaying(Boolean(album.tracks[next]?.audioUrl)); };
  const handlePrev = () => { const next = (currentTrackIndex - 1 + album.tracks.length) % album.tracks.length; setProgress(0); setCurrentTrackIndex(next); setIsPlaying(Boolean(album.tracks[next]?.audioUrl)); };

  const formatTime = (perc: number) => {
    const total = Math.floor(audioDuration || album?.tracks[currentTrackIndex]?.duration || 0);
    const cur = Math.floor((perc / 100) * total);
    const f = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
    return { current: f(cur), total: f(total) };
  };
  const time = formatTime(progress);

  const getContentClass = () => {
    if (slideDir === "left") return "animate-slideOutLeft";
    if (slideDir === "right") return "animate-slideOutRight";
    if (!transitioning) return "animate-slideIn";
    return "opacity-0";
  };

  if (loading || !album) {
    const message = loadError || (loading ? "디스코그래피를 불러오는 중입니다." : "공개된 앨범이 없습니다.");
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "#050505" }}>
        <p className="text-sm text-gray-400">{message}</p>
      </main>
    );
  }

  return (
    <main className="h-screen w-full relative overflow-hidden flex flex-col" style={{ backgroundColor: "#050505" }}>
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={(event) => setAudioDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
        onTimeUpdate={(event) => { const audio = event.currentTarget; setAudioDuration(Number.isFinite(audio.duration) ? audio.duration : 0); setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0); }}
        onEnded={handleNext}
      />

      {/* Blurred Cover Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-[-80px] transition-opacity duration-700" style={{ willChange: "opacity" }}>
          <Image
            key={album.id}
            src={album.cover}
            alt=""
            fill
            sizes="100vw"
            className="object-cover blur-[100px] scale-[1.4] brightness-[0.15] saturate-150 transition-all duration-1000"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/30" />
      </div>

      {/* Full-Screen Split Content */}
      <div className={`flex-1 grid grid-cols-1 lg:grid-cols-12 items-center max-w-[1400px] mx-auto px-8 w-full relative z-10 overflow-visible pt-28 gap-8 ${getContentClass()}`}>

        {/* LEFT: 3D Cover + CD Fan-Out */}
        <div className="lg:col-span-7 flex justify-center items-center relative" style={{ perspective: "1600px" }}>
          <div
            className="relative select-none"
            style={{
              width: "clamp(280px, 36vw, 440px)",
              height: "clamp(280px, 36vw, 440px)",
              transformStyle: "preserve-3d",
            }}
          >
            {/* CDs behind the cover */}
            {album.tracks.map((track, tIdx) => {
              const total = album.tracks.length;
              const isActiveTrack = currentTrackIndex === tIdx;

              const fanX = showDiscs ? 90 + tIdx * 58 : 0;
              const fanY = showDiscs ? (tIdx - (total - 1) / 2) * 20 : 0;
              const fanZ = showDiscs ? -(60 + tIdx * 15) : -30;
              const fanRotZ = showDiscs ? (tIdx - (total - 1) / 2) * 4 : 0;

              return (
                <div
                  key={`${album.id}-disc-${tIdx}`}
                  onClick={(e) => { e.stopPropagation(); if (showDiscs) playTrack(tIdx); }}
                  onMouseEnter={() => showDiscs && setHoveredDisc(tIdx)}
                  onMouseLeave={() => hoveredDisc === tIdx && setHoveredDisc(null)}
                  className={`absolute rounded-full group/cd ${showDiscs ? "cursor-pointer" : ""}`}
                  style={{
                    width: "78%",
                    aspectRatio: "1 / 1",
                    left: "50%",
                    top: "50%",
                    transform: `translate(-50%, -50%) translateX(${fanX}px) translateY(${fanY}px) translateZ(${fanZ}px) rotateZ(${fanRotZ}deg)`,
                    transition: `transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) ${tIdx * 0.05}s, opacity 0.5s, filter 0.2s, z-index 0s`,
                    transformStyle: "preserve-3d",
                    zIndex: hoveredDisc === tIdx ? 100 : (showDiscs ? 40 + tIdx : 5 - tIdx),
                    willChange: "transform",
                    opacity: showDiscs ? 1 : 0,
                    pointerEvents: showDiscs ? "auto" : "none",
                  }}
                >
                  <div
                    className={`absolute inset-0 rounded-full overflow-hidden transition-shadow duration-200 group-hover/cd:shadow-[0_0_40px_rgba(255,255,255,0.15)] ${
                      isActiveTrack && isPlaying ? "animate-vinyl-spin" : "animate-vinyl-spin animation-paused"
                    }`}
                    style={{
                      border: isActiveTrack ? `3px solid ${album.color}` : "2px solid rgba(15,15,15,0.95)",
                      boxShadow: isActiveTrack
                        ? `0 0 30px ${album.color}40, 0 8px 35px rgba(0,0,0,0.6)`
                        : "0 6px 25px rgba(0,0,0,0.5)",
                      willChange: "transform",
                    }}
                  >
                    <Image src={track.logoUrl || album.cover} alt={track.title} fill className={`${track.logoUrl ? "object-contain p-10" : "object-cover brightness-[0.5] group-hover/cd:brightness-[0.7]"} transition-[filter] duration-200`} sizes="300px" />

                    <div className="absolute inset-0 rounded-full pointer-events-none"
                      style={{ background: "radial-gradient(circle, transparent 26%, rgba(0,0,0,0.3) 28%, transparent 30%, transparent 46%, rgba(0,0,0,0.2) 48%, transparent 50%, transparent 66%, rgba(0,0,0,0.12) 68%, transparent 70%, transparent 86%, rgba(0,0,0,0.08) 88%, transparent 90%)" }}
                    />

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-[28%] h-[28%] rounded-full overflow-hidden border-2 border-black/70 relative">
                        <Image src={album.cover} alt="" fill className="object-cover opacity-60 scale-[1.8]" sizes="100px" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-[22%] h-[22%] rounded-full bg-black border border-white/10" />
                        </div>
                      </div>
                    </div>
                  </div>


                </div>
              );
            })}

            {/* Album Cover Jacket */}
            <div
              onClick={() => setShowDiscs((p) => !p)}
              className="absolute inset-0 rounded-2xl overflow-hidden cursor-pointer z-30 group"
              style={{
                transform: showDiscs
                  ? "rotateY(-28deg) rotateX(3deg) translateZ(40px)"
                  : "rotateY(0deg) translateZ(0px)",
                transition: "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.7s ease",
                transformStyle: "preserve-3d",
                boxShadow: showDiscs
                  ? `18px 12px 50px rgba(0,0,0,0.85), 0 0 60px ${album.color}10`
                  : `0 18px 50px rgba(0,0,0,0.7)`,
                border: `1px solid ${showDiscs ? `${album.color}40` : "rgba(255,255,255,0.05)"}`,
                willChange: "transform",
              }}
            >
              <Image src={album.cover} alt={album.title} fill priority sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 440px" className="object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent pointer-events-none" />

              <div
                className="absolute bottom-5 left-5 px-3 py-1.5 rounded shadow-lg flex flex-col select-none"
                style={{ backgroundColor: album.color, color: "#000", boxShadow: `0 4px 18px ${album.color}35` }}
              >
                <span className="text-[6px] font-display font-bold tracking-[0.2em] opacity-60">{artistName}</span>
                <span className="text-[11px] font-black tracking-tight">{album.title}</span>
              </div>

              <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-white/8">
                <svg className={`w-3.5 h-3.5 text-white transition-transform duration-500 ${showDiscs ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Info + Tabs */}
        <div className="lg:col-span-5 flex flex-col gap-4 w-full relative z-20 h-full max-h-[600px]">
          {/* Header */}
          <div className="shrink-0">
            <span className="text-[10px] font-black tracking-[0.3em] uppercase" style={{ color: album.color, transition: "color 0.5s" }}>{album.type}</span>
            <div className="flex items-center justify-between mt-1">
              <h2 className="text-4xl md:text-5xl font-black font-display tracking-tight text-white leading-none">{album.title}</h2>
              <div className="flex gap-2">
                <a href={album.links?.youtube || "#"} target="_blank" className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-white hover:text-gray-200">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>
                </a>
                <a href={album.links?.spotify || "#"} target="_blank" className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-white hover:text-gray-200">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.62 14.39c-.19.31-.59.41-.9.22-2.46-1.5-5.56-1.84-9.22-1.01-.36.08-.71-.14-.79-.5-.08-.36.14-.71.5-.79 3.99-.89 7.43-.51 10.19 1.18.31.18.41.59.22.9zm1.31-2.91c-.24.39-.75.52-1.14.28-2.82-1.74-7.14-2.27-10.42-1.24-.44.14-.9-.11-1.04-.55-.14-.44.11-.9.55-1.04 3.75-1.18 8.52-.59 11.76 1.41.39.24.52.75.28 1.14zm.12-3.05c-3.38-2.01-8.96-2.19-12.18-1.21-.52.16-1.08-.13-1.24-.65-.16-.52.13-1.08.65-1.24 3.72-1.13 9.9-.92 13.79 1.39.47.28.62.89.34 1.36-.28.47-.89.62-1.36.34z"/></svg>
                </a>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 font-medium tracking-wider mt-2">{album.releaseDate}</p>
          </div>

          {/* Tabs Navigation */}
          <div className="flex gap-5 border-b border-white/10 pb-2 mt-1 relative shrink-0">
            {(["concept", "intro", "members"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[11px] font-bold tracking-widest uppercase transition-colors duration-300 relative pb-1 ${activeTab === tab ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
              >
                {tab === "concept" ? "TITLE IMAGE" : tab === "intro" ? "TRACK INTRO" : "MEMBERS"}
                {activeTab === tab && (
                  <span className="absolute -bottom-[9px] left-0 right-0 h-[2px] bg-white rounded-t-full shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 relative min-h-[300px]">
            {/* Concept Tab */}
            {activeTab === "concept" && (
              <div className="absolute inset-0 animate-slideIn flex flex-col">
                <div className="relative w-full flex-1 rounded-2xl overflow-hidden border border-white/10 shadow-lg group">
                  <Image src={album.conceptPhoto || album.cover} alt="Concept" fill sizes="(max-width: 1024px) 100vw, 500px" className="object-cover transition-transform duration-1000 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-700 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Intro Tab */}
            {activeTab === "intro" && (
              <div className="absolute inset-0 flex flex-col gap-4 animate-slideIn">
                <p className="text-sm text-gray-400 font-light leading-relaxed max-w-md shrink-0">{album.desc[locale]}</p>

                {/* Player */}
                <div className="p-4 rounded-2xl flex flex-col gap-3 shrink-0"
                  style={{ backgroundColor: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(12px)" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <span className="text-[8px] text-gray-600 font-black tracking-[0.15em] block">NOW PLAYING</span>
                      <span className="text-base font-bold text-white block truncate mt-0.5">{album.tracks[currentTrackIndex]?.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-500 shrink-0">{time.current} / {time.total}</span>
                  </div>

                  <div className="relative w-full group/bar cursor-pointer py-1.5 -my-1.5"
                    onClick={(e) => { const bar = e.currentTarget.querySelector('[data-bar]') as HTMLElement; if (!bar) return; const r = bar.getBoundingClientRect(); const next = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)); setProgress(next); if (audioRef.current?.duration) audioRef.current.currentTime = (next / 100) * audioRef.current.duration; }}
                  >
                    <div data-bar className="relative w-full h-[3px] bg-white/8 rounded-full overflow-visible group-hover/bar:h-[5px] transition-all duration-200">
                      <div className="h-full rounded-full relative" style={{ width: `${progress}%`, backgroundColor: album.color, transition: "width 75ms linear" }}>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 shadow-md" style={{ backgroundColor: album.color, boxShadow: `0 0 8px ${album.color}60` }} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-6 mt-1">
                    <button onClick={handlePrev} className="text-gray-500 hover:text-white transition-colors duration-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                    </button>
                    <button onClick={togglePlay} disabled={!album.tracks[currentTrackIndex]?.audioUrl} title={album.tracks[currentTrackIndex]?.audioUrl ? "재생" : "등록된 MP3가 없습니다"} className="w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 disabled:opacity-30 disabled:hover:scale-100" style={{ backgroundColor: album.color, color: "#000", transition: "background-color 0.5s, transform 0.2s" }}>
                      {isPlaying ? (
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                      ) : (
                        <svg className="w-5 h-5 fill-current pl-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      )}
                    </button>
                    <button onClick={handleNext} className="text-gray-500 hover:text-white transition-colors duration-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                    </button>
                  </div>
                </div>

                {/* Tracklist */}
                <div className="flex flex-col gap-1 flex-1 overflow-y-auto scrollbar-none pr-1 min-h-0">
                  {album.tracks.map((track, idx) => {
                    const isActive = currentTrackIndex === idx;
                    const isHovered = hoveredDisc === idx;
                    return (
                      <div key={track.title} className="flex items-center rounded-xl group/track relative shrink-0 pr-2"
                        style={{
                          backgroundColor: isActive ? "rgba(255,255,255,0.06)" : (isHovered ? "rgba(255,255,255,0.04)" : undefined),
                          border: `1px solid ${isActive ? `${album.color}50` : (isHovered ? `${album.color}40` : "transparent")}`,
                          boxShadow: isHovered && !isActive ? `0 0 15px ${album.color}20` : undefined,
                          transition: "all 0.2s ease",
                        }}
                      >
                        <button type="button" onClick={() => playTrack(idx)} className="flex flex-1 items-center gap-3 min-w-0 p-2.5 text-left cursor-pointer">
                          <span className="text-[10px] font-mono shrink-0 transition-colors duration-200" style={{ color: isActive || isHovered ? album.color : "#4b5563" }}>{(idx + 1).toString().padStart(2, "0")}</span>
                          {track.logoUrl && <span className="relative w-7 h-7 shrink-0 rounded bg-white/5 overflow-hidden"><Image src={track.logoUrl} alt="" fill sizes="28px" className="object-contain p-1" /></span>}
                          <span className={`text-sm font-semibold truncate transition-colors duration-200 ${isActive || isHovered ? "text-white" : "text-gray-500 group-hover/track:text-gray-300"}`}>{track.title}</span>
                          {track.isTitle && <span className="text-[7px] font-black tracking-wider px-1.5 py-0.5 rounded" style={{ color: album.color, border: `1px solid ${album.color}45` }}>TITLE</span>}
                        </button>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {track.spotifyUrl && <a href={track.spotifyUrl} target="_blank" rel="noreferrer" aria-label={`${track.title} Spotify`} className="text-[8px] font-bold text-gray-500 hover:text-white px-1.5 py-1">SP</a>}
                          {track.videoUrl && <a href={track.videoUrl} target="_blank" rel="noreferrer" aria-label={`${track.title} 뮤직비디오`} className="text-[8px] font-bold text-gray-500 hover:text-white px-1.5 py-1">MV</a>}
                        </div>
                        {isActive && isPlaying && (
                          <div className="flex gap-[2px] items-end h-3 shrink-0">
                            <span className="w-[3px] h-[5px] rounded-full animate-bounce" style={{ backgroundColor: album.color, animationDelay: "0s" }} />
                            <span className="w-[3px] h-[10px] rounded-full animate-bounce" style={{ backgroundColor: album.color, animationDelay: "0.15s" }} />
                            <span className="w-[3px] h-[7px] rounded-full animate-bounce" style={{ backgroundColor: album.color, animationDelay: "0.3s" }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Members Tab */}
            {activeTab === "members" && (
              <div className="absolute inset-0 animate-slideIn">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 h-full">
                  <p className="col-span-full self-center text-sm text-gray-500">등록된 멤버 정보가 없습니다.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Album Dock */}
      <div className="w-full py-3 border-t z-10 relative shrink-0"
        style={{ backgroundColor: "rgba(8,8,8,0.65)", backdropFilter: "blur(24px) saturate(1.3)", borderColor: "rgba(255,255,255,0.04)" }}
      >
        <div className="max-w-[1400px] mx-auto px-8 flex items-center gap-5">
          <button
            onClick={() => switchAlbum(Math.max(albumIndex - 1, 0))}
            disabled={albumIndex === 0}
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all duration-200 hover:border-white/20 disabled:opacity-20 disabled:cursor-default"
            style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)" }}
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </button>

          <div className="flex-1 flex items-center gap-2.5 overflow-x-auto scrollbar-none py-1">
              {albums.map((a, idx) => {
              const isCurrent = idx === albumIndex;
              return (
                <button
                  key={a.id}
                  onClick={() => switchAlbum(idx)}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl border shrink-0 group cursor-pointer hover:bg-white/[0.04] active:scale-[0.97]"
                  style={{
                    backgroundColor: isCurrent ? "rgba(255,255,255,0.06)" : undefined,
                    borderColor: isCurrent ? album.color : "transparent",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden border shrink-0 transition-all duration-200 group-hover:border-white/20" style={{ borderColor: isCurrent ? `${a.color}60` : "rgba(255,255,255,0.06)" }}>
                    <Image src={a.cover} alt={a.title} fill className="object-cover transition-transform duration-300 group-hover:scale-110" sizes="40px" />
                  </div>
                  <div className="text-left shrink-0 pr-1">
                    <p className={`text-[10px] font-black leading-none tracking-tight transition-colors duration-200 ${isCurrent ? "text-white" : "text-gray-500 group-hover:text-gray-200"}`}>{a.title}</p>
                    <p className={`text-[7px] uppercase font-medium mt-0.5 tracking-wider transition-colors duration-200 ${isCurrent ? "text-gray-400" : "text-gray-600 group-hover:text-gray-500"}`}>{a.type}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => switchAlbum(Math.min(albumIndex + 1, albums.length - 1))}
            disabled={albumIndex === albums.length - 1}
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all duration-200 hover:border-white/20 disabled:opacity-20 disabled:cursor-default"
            style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)" }}
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </button>
        </div>
      </div>
    </main>
  );
}
