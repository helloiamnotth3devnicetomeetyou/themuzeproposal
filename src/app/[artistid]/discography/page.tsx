"use client";

import { useState, useEffect, useRef, useCallback, type CSSProperties } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { LuChevronLeft, LuChevronRight, LuPause, LuPlay } from "react-icons/lu";
import { SiSpotify, SiYoutube } from "react-icons/si";
import { useLocale } from "../../context/LocaleContext";
import { supabase } from "@/lib/supabase";
import LoadingIndicator from "@/components/LoadingIndicator";

interface Track {
  title: string;
  isTitle: boolean;
  spotifyUrl?: string;
  youtubeUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  logoUrl?: string;
}

interface RawDiscographyAlbum {
  id: string; title: string; type: string; release_date: string | null; cover_url: string; hero_image_url: string | null; color: string | null;
  description_ko: string | null; description_en: string | null; description_ja: string | null;
  spotify_id: string | null; youtube_url: string | null;
  tracks: Array<{ title: string; track_number: number; is_title: boolean; spotify_url: string | null; youtube_url: string | null; audio_url: string | null; music_video_url: string | null; logo_url: string | null }>;
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
  titleImage?: string;
  links?: { youtube?: string; spotify?: string };
}

type PlaybackMemory = {
  albumId: string;
  trackIndex: number;
  currentTime: number;
};

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
  const albumRailRef = useRef<HTMLDivElement | null>(null);
  const restoreTimeRef = useRef(0);
  const lastSavedSecondRef = useRef(-1);
  const album = albums[albumIndex];

  const savePlayback = useCallback((albumId: string, trackIndex: number, currentTime: number) => {
    try {
      localStorage.setItem(`themuze:discography:${artistid}`, JSON.stringify({ albumId, trackIndex, currentTime }));
    } catch {
      // Playback memory is optional when storage is unavailable.
    }
  }, [artistid]);

  useEffect(() => {
    let cancelled = false;

    async function loadDiscography() {
      const requestedAlbumId = new URLSearchParams(window.location.search).get("album");
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
        .select("id,title,type,release_date,cover_url,hero_image_url,color,description_ko,description_en,description_ja,spotify_id,youtube_url,tracks(title,track_number,is_title,spotify_url,youtube_url,audio_url,music_video_url,logo_url)")
        .eq("artist_id", artist.id)
        .eq("is_published", true)
        .lte("published_at", new Date().toISOString())
        .order("sort_order", { ascending: true });

      if (cancelled) return;
      if (albumsResult.error) {
        setLoadError("디스코그래피를 불러오지 못했습니다.");
      } else {
        const nextAlbums = ((albumsResult.data ?? []) as unknown as RawDiscographyAlbum[]).map((item) => ({
          id: item.id,
          title: item.title,
          type: item.type,
          releaseDate: item.release_date ?? "",
          cover: item.cover_url,
          titleImage: item.hero_image_url || undefined,
          color: item.color || "#FC6FCF",
          tracks: (item.tracks || []).sort((a: { track_number: number }, b: { track_number: number }) => a.track_number - b.track_number).map((track: { title: string; is_title: boolean; spotify_url: string | null; youtube_url: string | null; audio_url: string | null; music_video_url: string | null; logo_url: string | null }) => ({
            title: track.title,
            isTitle: track.is_title,
            spotifyUrl: track.spotify_url || undefined,
            youtubeUrl: track.youtube_url || undefined,
            audioUrl: track.audio_url || undefined,
            videoUrl: track.music_video_url || undefined,
            logoUrl: track.logo_url || undefined,
          })),
          desc: { ko: item.description_ko || "", en: item.description_en || "", ja: item.description_ja || "" },
          links: { spotify: item.spotify_id ? `https://open.spotify.com/album/${item.spotify_id}` : undefined, youtube: item.youtube_url || undefined },
        }));
        const requestedIndex = requestedAlbumId ? nextAlbums.findIndex((item) => item.id === requestedAlbumId) : -1;
        let remembered: PlaybackMemory | null = null;
        try {
          const stored = localStorage.getItem(`themuze:discography:${artistid}`);
          if (stored) remembered = JSON.parse(stored) as PlaybackMemory;
        } catch {
          remembered = null;
        }
        const rememberedIndex = remembered ? nextAlbums.findIndex((item) => item.id === remembered?.albumId) : -1;
        const nextAlbumIndex = requestedIndex >= 0 ? requestedIndex : rememberedIndex >= 0 ? rememberedIndex : 0;
        const rememberedAlbumMatches = Boolean(remembered && nextAlbums[nextAlbumIndex]?.id === remembered.albumId);
        const rememberedTrackIndex = rememberedAlbumMatches
          ? Math.max(0, Math.min(remembered?.trackIndex ?? 0, Math.max(0, (nextAlbums[nextAlbumIndex]?.tracks.length ?? 1) - 1)))
          : 0;

        setArtistName(artist.name || artistid.toUpperCase());
        setAlbums(nextAlbums);
        setAlbumIndex(nextAlbumIndex);
        setCurrentTrackIndex(rememberedTrackIndex);
        restoreTimeRef.current = rememberedAlbumMatches ? Math.max(0, remembered?.currentTime ?? 0) : 0;
        if (nextAlbums[nextAlbumIndex]) {
          const url = new URL(window.location.href);
          url.searchParams.set("album", nextAlbums[nextAlbumIndex].id);
          window.history.replaceState({}, "", url);
        }
      }
      setLoading(false);
    }

    void loadDiscography();
    return () => { cancelled = true; };
  }, [artistid]);

  // Smooth album switch
  const switchAlbum = useCallback((newIndex: number) => {
    if (newIndex === albumIndex || transitioning) return;
    const nextAlbum = albums[newIndex];
    if (!nextAlbum) return;
    setSlideDir(newIndex > albumIndex ? "left" : "right");
    setTransitioning(true);
    setShowDiscs(false);
    setIsPlaying(false);
    restoreTimeRef.current = 0;
    savePlayback(nextAlbum.id, 0, 0);
    const url = new URL(window.location.href);
    url.searchParams.set("album", nextAlbum.id);
    window.history.replaceState({}, "", url);

    setTimeout(() => {
      setAlbumIndex(newIndex);
      setCurrentTrackIndex(0);
      setProgress(0);
      setAudioDuration(0);
      setSlideDir(null);
      setActiveTab("intro");

      requestAnimationFrame(() => {
        setTransitioning(false);
      });
    }, 350);
  }, [albumIndex, albums, savePlayback, transitioning]);

  useEffect(() => {
    const rail = albumRailRef.current;
    const current = rail?.querySelector<HTMLElement>(`[data-album-index="${albumIndex}"]`);
    if (!current) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    current.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest", inline: "center" });
  }, [albumIndex, albums.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, button, a, [contenteditable='true']")) return;
      if (e.key === "ArrowRight") switchAlbum(Math.min(albumIndex + 1, albums.length - 1));
      if (e.key === "ArrowLeft") switchAlbum(Math.max(albumIndex - 1, 0));
      if (e.key === " " && album?.tracks[currentTrackIndex]?.audioUrl) {
        e.preventDefault();
        if (!isPlaying) setShowDiscs(true);
        setIsPlaying((playing) => !playing);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [albumIndex, switchAlbum, albums.length, album, currentTrackIndex, isPlaying]);

  // Real MP3 playback from the managed track asset.
  useEffect(() => {
    const audio = audioRef.current;
    const source = album?.tracks[currentTrackIndex]?.audioUrl;
    if (!audio) return;
    if (!source) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      return;
    }
    if (audio.src !== source) { audio.src = source; audio.load(); }
    if (isPlaying) void audio.play().catch(() => setIsPlaying(false));
    else audio.pause();
  }, [isPlaying, currentTrackIndex, album]);

  useEffect(() => {
    const remember = () => {
      if (!album) return;
      savePlayback(album.id, currentTrackIndex, audioRef.current?.currentTime || 0);
    };
    window.addEventListener("pagehide", remember);
    return () => window.removeEventListener("pagehide", remember);
  }, [album, currentTrackIndex, savePlayback]);

  const playTrack = (idx: number) => { const canPlay = Boolean(album.tracks[idx]?.audioUrl); restoreTimeRef.current = 0; setCurrentTrackIndex(idx); setProgress(0); setAudioDuration(0); if (canPlay) setShowDiscs(true); setIsPlaying(canPlay); savePlayback(album.id, idx, 0); };
  const togglePlay = () => { if (album.tracks[currentTrackIndex]?.audioUrl) { if (!isPlaying) setShowDiscs(true); setIsPlaying(!isPlaying); } };
  const handleNext = () => { const next = (currentTrackIndex + 1) % album.tracks.length; const canPlay = Boolean(album.tracks[next]?.audioUrl); restoreTimeRef.current = 0; setProgress(0); setAudioDuration(0); setCurrentTrackIndex(next); if (canPlay) setShowDiscs(true); setIsPlaying(canPlay); savePlayback(album.id, next, 0); };
  const handlePrev = () => { const next = (currentTrackIndex - 1 + album.tracks.length) % album.tracks.length; const canPlay = Boolean(album.tracks[next]?.audioUrl); restoreTimeRef.current = 0; setProgress(0); setAudioDuration(0); setCurrentTrackIndex(next); if (canPlay) setShowDiscs(true); setIsPlaying(canPlay); savePlayback(album.id, next, 0); };

  const formatTime = (perc: number) => {
    const total = Math.floor(audioDuration || 0);
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
        {loading ? <LoadingIndicator label={message} className="text-gray-400" /> : <p className="text-sm text-gray-400">{message}</p>}
      </main>
    );
  }

  return (
    <main className="h-screen w-full relative overflow-hidden flex flex-col" style={{ backgroundColor: "#050505" }}>
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={(event) => {
          const duration = Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0;
          setAudioDuration(duration);
          if (duration && restoreTimeRef.current > 0) {
            const restoredTime = Math.min(restoreTimeRef.current, Math.max(0, duration - .25));
            event.currentTarget.currentTime = restoredTime;
            setProgress((restoredTime / duration) * 100);
            restoreTimeRef.current = 0;
          }
        }}
        onTimeUpdate={(event) => {
          const audio = event.currentTarget;
          setAudioDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
          setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
          const second = Math.floor(audio.currentTime);
          if (album && second !== lastSavedSecondRef.current && second % 2 === 0) {
            lastSavedSecondRef.current = second;
            savePlayback(album.id, currentTrackIndex, audio.currentTime);
          }
        }}
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
            className="object-cover blur-[100px] scale-[1.4] brightness-[0.1] saturate-150 transition-all duration-1000"
            priority
          />
        </div>
        <div
          className={`discography-ambient-layer ${isPlaying ? "is-playing" : ""}`}
          style={{ "--album-accent": album.color } as CSSProperties}
          aria-hidden="true"
        >
          <span className="discography-ambient-orb is-primary" />
          <span className="discography-ambient-orb is-secondary" />
          <span className="discography-ambient-orb is-glow" />
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
                    <Image src={track.logoUrl || album.cover} alt={track.logoUrl ? `${track.title} 타이포 로고` : track.title} fill className={`${track.logoUrl ? "object-contain p-10" : "object-cover brightness-[0.5] group-hover/cd:brightness-[0.7]"} transition-[filter] duration-200`} sizes="300px" />

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
                <LuChevronRight className={`w-3.5 h-3.5 text-white transition-transform duration-500 ${showDiscs ? "rotate-180" : ""}`} aria-hidden="true" />
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
                <a href={album.links?.spotify || "#"} target="_blank" aria-label={`${album.title} on Spotify`} className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-white hover:text-gray-200">
                  <SiSpotify className="w-4 h-4" aria-hidden="true" />
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
                  <Image src={album.titleImage || album.cover} alt={`${album.title} title image`} fill sizes="(max-width: 1024px) 100vw, 500px" className="object-cover transition-transform duration-1000 group-hover:scale-105" />
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
                    <span className="text-[10px] text-gray-500 shrink-0">{time.current} / {time.total}</span>
                  </div>

                  <label className="discography-progress-wrap">
                    <span className="sr-only">{album.tracks[currentTrackIndex]?.title} 재생 위치</span>
                    <input
                      className="discography-progress"
                      type="range"
                      min="0"
                      max="100"
                      step="0.1"
                      value={progress}
                      disabled={!album.tracks[currentTrackIndex]?.audioUrl || !audioDuration}
                      aria-valuetext={`${time.current} / ${time.total}`}
                      style={{ "--progress": `${progress}%`, "--album-accent": album.color } as CSSProperties}
                      onChange={(event) => {
                        const next = Number(event.currentTarget.value);
                        setProgress(next);
                        const audio = audioRef.current;
                        if (audio?.duration) {
                          audio.currentTime = (next / 100) * audio.duration;
                          savePlayback(album.id, currentTrackIndex, audio.currentTime);
                        }
                      }}
                    />
                  </label>

                  <div className="grid grid-cols-[1fr_auto_1fr] items-center mt-1">
                    <span aria-hidden="true" />
                    <div className="flex items-center justify-center gap-6">
                      <button onClick={handlePrev} className="text-gray-500 hover:text-white transition-colors duration-200" aria-label="이전 트랙">
                        <LuChevronLeft className="w-5 h-5" aria-hidden="true" />
                      </button>
                      <button onClick={togglePlay} disabled={!album.tracks[currentTrackIndex]?.audioUrl} title={album.tracks[currentTrackIndex]?.audioUrl ? "재생" : "등록된 MP3가 없습니다"} className="w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 disabled:opacity-30 disabled:hover:scale-100" style={{ backgroundColor: album.color, color: "#000", transition: "background-color 0.5s, transform 0.2s" }}>
                        {isPlaying ? (
                          <LuPause className="w-5 h-5" aria-hidden="true" />
                        ) : (
                          <LuPlay className="w-5 h-5 pl-0.5" aria-hidden="true" />
                        )}
                      </button>
                      <button onClick={handleNext} className="text-gray-500 hover:text-white transition-colors duration-200" aria-label="다음 트랙">
                        <LuChevronRight className="w-5 h-5" aria-hidden="true" />
                      </button>
                    </div>
                    {album.tracks[currentTrackIndex]?.youtubeUrl ? (
                      <a
                        href={album.tracks[currentTrackIndex].youtubeUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${album.tracks[currentTrackIndex].title} 뮤직비디오 보기`}
                        className="discography-youtube-button justify-self-end"
                      >
                        <SiYoutube aria-hidden="true" />
                        <span>MV</span>
                      </a>
                    ) : <span aria-hidden="true" />}
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
                          <span className="text-[10px] shrink-0 transition-colors duration-200" style={{ color: isActive || isHovered ? album.color : "#4b5563" }}>{(idx + 1).toString().padStart(2, "0")}</span>
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
            aria-label="이전 앨범"
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all duration-200 hover:border-white/20 disabled:opacity-20 disabled:cursor-default"
            style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)" }}
          >
            <LuChevronLeft className="w-4 h-4 text-white" aria-hidden="true" />
          </button>

          <div ref={albumRailRef} className="discography-album-rail flex-1 flex items-center gap-2.5 overflow-x-auto scrollbar-none py-1">
              {albums.map((a, idx) => {
              const isCurrent = idx === albumIndex;
              return (
                <button
                  key={a.id}
                  onClick={() => switchAlbum(idx)}
                  data-album-index={idx}
                  aria-pressed={isCurrent}
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
            aria-label="다음 앨범"
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all duration-200 hover:border-white/20 disabled:opacity-20 disabled:cursor-default"
            style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)" }}
          >
            <LuChevronRight className="w-4 h-4 text-white" aria-hidden="true" />
          </button>
        </div>
      </div>
    </main>
  );
}
