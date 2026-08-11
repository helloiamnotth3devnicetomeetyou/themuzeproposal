"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { AlbumPreviewPayload } from "@/core/preview/types";
import { localizeText } from "@/core/i18n/localized";
import { useLocale } from "@/core/providers/LocaleContext";

import { savePlaybackMemory, syncAlbumQuery } from "../lib/playback-memory";
import type {
  AlbumSort,
  DiscographyTab,
  RailPhase,
  SlideDirection,
} from "../lib/types";
import { useAudioPlayback } from "./useAudioPlayback";
import { previewToAlbum } from "./discography-controller-utils";
import { useDiscographyData } from "./useDiscographyData";
import { useDiscographyRailSort } from "./useDiscographyRailSort";

const ALBUM_TRANSITION_MS = 220;

export function useDiscographyController(
  artistSlug: string,
  audioRef: RefObject<HTMLAudioElement | null>,
  albumRailRef: RefObject<HTMLDivElement | null>,
  preview: AlbumPreviewPayload | null,
) {
  const { locale } = useLocale();
  const [transitioning, setTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<SlideDirection>(null);
  const [hoveredDisc, setHoveredDisc] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<DiscographyTab>("intro");
  const [sortBy, setSortBy] = useState<AlbumSort>("date-desc");
  const [railPhase, setRailPhase] = useState<RailPhase>("idle");

  const albumTransitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const railTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const {
    isPlaying,
    audioDuration,
    showDiscs,
    currentTrackIndex,
    time,
    setIsPlaying,
    setProgress,
    setAudioDuration,
    setShowDiscs,
    setCurrentTrackIndex,
    restoreTimeRef,
    handleLoadedMetadata,
    handleTimeUpdate: rawHandleTimeUpdate,
  } = useAudioPlayback(audioRef);

  const {
    albumIndex,
    artistName,
    artistNames,
    albums,
    gallery,
    loading,
    loadError,
    members,
    setAlbumIndex,
  } = useDiscographyData(artistSlug, setCurrentTrackIndex, restoreTimeRef);

  const previewAlbum = useMemo(() => previewToAlbum(preview), [preview]);
  const effectiveAlbums = useMemo(() => {
    if (!previewAlbum) return albums;
    const exists = albums.some((item) => item.id === previewAlbum.id);
    return exists
      ? albums.map((item) => item.id === previewAlbum.id ? previewAlbum : item)
      : [...albums, previewAlbum];
  }, [albums, previewAlbum]);
  const sortedAlbums = useMemo(
    () =>
      effectiveAlbums.map((item) => ({
        ...item,
        title: localizeText(item.titles, locale, item.title),
        tracks: item.tracks.map((track) => ({ ...track, title: localizeText(track.titles, locale, track.title) })),
      })).sort((a, b) =>
        sortBy === "date-asc"
          ? (a.releaseDate || "").localeCompare(b.releaseDate || "")
          : (b.releaseDate || "").localeCompare(a.releaseDate || ""),
      ),
    [effectiveAlbums, locale, sortBy],
  );
  const localizedMembers = useMemo(
    () => members.map((member) => ({
      ...member,
      name: localizeText(member.names, locale, member.name),
      role: localizeText(member.roles, locale, member.role || ""),
    })),
    [locale, members],
  );
  const album = sortedAlbums[albumIndex];

  useEffect(() => {
    if (!previewAlbum) return;
    const index = sortedAlbums.findIndex((item) => item.id === previewAlbum.id);
    if (index < 0) return;
    const timer = window.setTimeout(() => setAlbumIndex(index), 0);
    return () => window.clearTimeout(timer);
  }, [previewAlbum, setAlbumIndex, sortedAlbums]);

  const savePlayback = useCallback(
    (albumId: string, trackIndex: number, currentTime: number) => {
      savePlaybackMemory(artistSlug, { albumId, trackIndex, currentTime });
    },
    [artistSlug],
  );

  const switchAlbum = useCallback(
    (newIndex: number) => {
      if (newIndex === albumIndex || transitioning) return;
      const nextAlbum = sortedAlbums[newIndex];
      if (!nextAlbum) return;

      setSlideDirection(newIndex > albumIndex ? "left" : "right");
      setTransitioning(true);
      setShowDiscs(false);
      setIsPlaying(false);
      restoreTimeRef.current = 0;
      savePlayback(nextAlbum.id, 0, 0);
      syncAlbumQuery(nextAlbum.id);

      if (albumTransitionTimerRef.current) clearTimeout(albumTransitionTimerRef.current);
      albumTransitionTimerRef.current = setTimeout(() => {
        setAlbumIndex(newIndex);
        setCurrentTrackIndex(0);
        setProgress(0);
        setAudioDuration(0);
        setSlideDirection(null);
        setActiveTab("intro");
        requestAnimationFrame(() => setTransitioning(false));
      }, ALBUM_TRANSITION_MS);
    },
    [albumIndex, savePlayback, sortedAlbums, transitioning, setShowDiscs, setIsPlaying, setCurrentTrackIndex, setProgress, setAudioDuration, restoreTimeRef, setAlbumIndex],
  );

  // Scroll album rail to active album
  useEffect(() => {
    const rail = albumRailRef.current;
    const current = rail?.querySelector<HTMLElement>(`[data-album-index="${albumIndex}"]`);
    if (!rail || !current) return;
    const targetScrollLeft = current.offsetLeft - rail.clientWidth / 2 + current.offsetWidth / 2;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rail.scrollTo({ left: targetScrollLeft, behavior: reducedMotion ? "auto" : "smooth" });
  }, [albumIndex, albumRailRef, sortedAlbums.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, button, a, [contenteditable='true']")) return;
      if (event.key === "ArrowRight") switchAlbum(Math.min(albumIndex + 1, sortedAlbums.length - 1));
      if (event.key === "ArrowLeft") switchAlbum(Math.max(albumIndex - 1, 0));
      if (event.key === " " && album?.tracks[currentTrackIndex]?.audioUrl) {
        event.preventDefault();
        if (!isPlaying) setShowDiscs(true);
        setIsPlaying((playing) => !playing);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [album, albumIndex, currentTrackIndex, isPlaying, sortedAlbums.length, switchAlbum, setShowDiscs, setIsPlaying]);

  // Audio src + play/pause
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
    if (audio.src !== source) {
      audio.src = source;
      audio.load();
    }
    if (isPlaying) void audio.play().catch(() => setIsPlaying(false));
    else audio.pause();
  }, [album, audioRef, currentTrackIndex, isPlaying, setIsPlaying]);

  // Save playback state on pagehide
  useEffect(() => {
    const remember = () => {
      if (!album) return;
      savePlayback(album.id, currentTrackIndex, audioRef.current?.currentTime || 0);
    };
    window.addEventListener("pagehide", remember);
    return () => window.removeEventListener("pagehide", remember);
  }, [album, audioRef, currentTrackIndex, savePlayback]);

  // Cleanup timers
  useEffect(
    () => () => {
      if (albumTransitionTimerRef.current) clearTimeout(albumTransitionTimerRef.current);
      railTimersRef.current.forEach(clearTimeout);
    },
    [],
  );

  const playTrack = useCallback(
    (index: number) => {
      if (!album?.tracks[index]) return;
      const canPlay = Boolean(album.tracks[index].audioUrl);
      restoreTimeRef.current = 0;
      setCurrentTrackIndex(index);
      setProgress(0);
      setAudioDuration(0);
      if (canPlay) setShowDiscs(true);
      setIsPlaying(canPlay);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        if (canPlay && isPlaying) {
          void audioRef.current.play().catch(() => setIsPlaying(false));
        }
      }
      savePlayback(album.id, index, 0);
    },
    [album, audioRef, isPlaying, savePlayback, setCurrentTrackIndex, setProgress, setAudioDuration, setShowDiscs, setIsPlaying, restoreTimeRef],
  );

  const togglePlay = useCallback(() => {
    if (!album?.tracks[currentTrackIndex]?.audioUrl) return;
    if (!isPlaying) setShowDiscs(true);
    setIsPlaying((playing) => !playing);
  }, [album, currentTrackIndex, isPlaying, setShowDiscs, setIsPlaying]);

  const moveTrack = useCallback(
    (offset: number) => {
      if (!album?.tracks.length) return;
      const next = (currentTrackIndex + offset + album.tracks.length) % album.tracks.length;
      playTrack(next);
    },
    [album, currentTrackIndex, playTrack],
  );

  const handleTimeUpdate = useCallback(
    (event: React.SyntheticEvent<HTMLAudioElement>) => {
      rawHandleTimeUpdate(event, album?.id, currentTrackIndex, savePlayback);
    },
    [rawHandleTimeUpdate, album, currentTrackIndex, savePlayback],
  );

  const toggleSort = useDiscographyRailSort({ railPhase, albumCount: sortedAlbums.length, railTimersRef, setRailPhase, setSortBy, setAlbumIndex });

  const handleEnded = useCallback(() => {
    if (!album?.tracks.length) return;
    const isLastTrack = currentTrackIndex >= album.tracks.length - 1;
    if (isLastTrack) {
      setIsPlaying(false);
      setProgress(0);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      savePlayback(album.id, currentTrackIndex, 0);
    } else {
      moveTrack(1);
    }
  }, [album, currentTrackIndex, moveTrack, savePlayback, setIsPlaying, setProgress, audioRef]);

  const contentClass =
    slideDirection === "left"
      ? "animate-slideOutLeft"
      : slideDirection === "right"
        ? "animate-slideOutRight"
        : !transitioning
          ? "animate-slideIn"
          : "opacity-0";

  return {
    activeTab,
    album,
    albumIndex,
    artistName: preview?.artist.name || localizeText(artistNames || {}, locale, artistName),
    audioDuration,
    contentClass,
    currentTrackIndex,
    handleLoadedMetadata,
    handleTimeUpdate,
    handleEnded,
    hoveredDisc,
    isPlaying,
    loading,
    loadError,
    members: localizedMembers,
    gallery,
    nextTrack: () => moveTrack(1),
    playTrack,
    previousTrack: () => moveTrack(-1),
    railPhase,
    setActiveTab,
    setHoveredDisc,
    setShowDiscs,
    showDiscs,
    sortBy,
    sortedAlbums,
    switchAlbum,
    time,
    togglePlay,
    toggleSort,
  };
}
