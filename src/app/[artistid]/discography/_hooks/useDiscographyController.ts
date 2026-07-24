"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type SyntheticEvent,
} from "react";

import { fetchDiscography } from "../_lib/discography-data";
import {
  readPlaybackMemory,
  requestedAlbumId,
  savePlaybackMemory,
  syncAlbumQuery,
} from "../_lib/playback-memory";
import type {
  AlbumSort,
  DiscographyAlbum,
  DiscographyTab,
  RailPhase,
  SlideDirection,
} from "../_lib/types";

const ALBUM_TRANSITION_MS = 350;

function formatTime(seconds: number) {
  const wholeSeconds = Math.floor(seconds);
  return `${Math.floor(wholeSeconds / 60)}:${(wholeSeconds % 60)
    .toString()
    .padStart(2, "0")}`;
}

export function useDiscographyController(
  artistSlug: string,
  audioRef: RefObject<HTMLAudioElement | null>,
  albumRailRef: RefObject<HTMLDivElement | null>,
) {
  const [albums, setAlbums] = useState<DiscographyAlbum[]>([]);
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
  const [slideDirection, setSlideDirection] =
    useState<SlideDirection>(null);
  const [hoveredDisc, setHoveredDisc] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<DiscographyTab>("intro");
  const [sortBy, setSortBy] = useState<AlbumSort>("date-desc");
  const [railPhase, setRailPhase] = useState<RailPhase>("idle");

  const restoreTimeRef = useRef(0);
  const lastSavedSecondRef = useRef(-1);
  const albumTransitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const railTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const sortedAlbums = useMemo(
    () =>
      [...albums].sort((a, b) =>
        sortBy === "date-asc"
          ? (a.releaseDate || "").localeCompare(b.releaseDate || "")
          : (b.releaseDate || "").localeCompare(a.releaseDate || ""),
      ),
    [albums, sortBy],
  );
  const album = sortedAlbums[albumIndex];

  const savePlayback = useCallback(
    (albumId: string, trackIndex: number, currentTime: number) => {
      savePlaybackMemory(artistSlug, {
        albumId,
        trackIndex,
        currentTime,
      });
    },
    [artistSlug],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      setAlbums([]);
      setArtistName("");
      setAlbumIndex(0);

      try {
        const result = await fetchDiscography(artistSlug);
        if (cancelled) return;

        const requestedId = requestedAlbumId();
        const remembered = readPlaybackMemory(artistSlug);
        const requestedIndex = requestedId
          ? result.albums.findIndex((item) => item.id === requestedId)
          : -1;
        const rememberedIndex = remembered
          ? result.albums.findIndex((item) => item.id === remembered.albumId)
          : -1;
        const nextAlbumIndex =
          requestedIndex >= 0
            ? requestedIndex
            : rememberedIndex >= 0
              ? rememberedIndex
              : 0;
        const rememberedAlbumMatches = Boolean(
          remembered &&
            result.albums[nextAlbumIndex]?.id === remembered.albumId,
        );
        const trackCount = result.albums[nextAlbumIndex]?.tracks.length ?? 0;
        const rememberedTrackIndex = rememberedAlbumMatches
          ? Math.max(
              0,
              Math.min(remembered?.trackIndex ?? 0, Math.max(0, trackCount - 1)),
            )
          : 0;

        setArtistName(result.artistName);
        setAlbums(result.albums);
        setAlbumIndex(nextAlbumIndex);
        setCurrentTrackIndex(rememberedTrackIndex);
        restoreTimeRef.current = rememberedAlbumMatches
          ? Math.max(0, remembered?.currentTime ?? 0)
          : 0;

        const selectedAlbum = result.albums[nextAlbumIndex];
        if (selectedAlbum) syncAlbumQuery(selectedAlbum.id);
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "디스코그래피를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [artistSlug]);

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

      if (albumTransitionTimerRef.current) {
        clearTimeout(albumTransitionTimerRef.current);
      }
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
    [albumIndex, savePlayback, sortedAlbums, transitioning],
  );

  useEffect(() => {
    const rail = albumRailRef.current;
    const current = rail?.querySelector<HTMLElement>(
      `[data-album-index="${albumIndex}"]`,
    );
    if (!current) return;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    current.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [albumIndex, albumRailRef, sortedAlbums.length]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.closest(
          "input, textarea, select, button, a, [contenteditable='true']",
        )
      ) {
        return;
      }
      if (event.key === "ArrowRight") {
        switchAlbum(Math.min(albumIndex + 1, sortedAlbums.length - 1));
      }
      if (event.key === "ArrowLeft") {
        switchAlbum(Math.max(albumIndex - 1, 0));
      }
      if (
        event.key === " " &&
        album?.tracks[currentTrackIndex]?.audioUrl
      ) {
        event.preventDefault();
        if (!isPlaying) setShowDiscs(true);
        setIsPlaying((playing) => !playing);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    album,
    albumIndex,
    currentTrackIndex,
    isPlaying,
    sortedAlbums.length,
    switchAlbum,
  ]);

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
    if (isPlaying) {
      void audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [album, audioRef, currentTrackIndex, isPlaying]);

  useEffect(() => {
    const remember = () => {
      if (!album) return;
      savePlayback(
        album.id,
        currentTrackIndex,
        audioRef.current?.currentTime || 0,
      );
    };
    window.addEventListener("pagehide", remember);
    return () => window.removeEventListener("pagehide", remember);
  }, [album, audioRef, currentTrackIndex, savePlayback]);

  useEffect(
    () => () => {
      if (albumTransitionTimerRef.current) {
        clearTimeout(albumTransitionTimerRef.current);
      }
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
      savePlayback(album.id, index, 0);
    },
    [album, savePlayback],
  );

  const togglePlay = useCallback(() => {
    if (!album?.tracks[currentTrackIndex]?.audioUrl) return;
    if (!isPlaying) setShowDiscs(true);
    setIsPlaying((playing) => !playing);
  }, [album, audioRef, currentTrackIndex, isPlaying]);

  const moveTrack = useCallback(
    (offset: number) => {
      if (!album?.tracks.length) return;
      const next =
        (currentTrackIndex + offset + album.tracks.length) %
        album.tracks.length;
      playTrack(next);
    },
    [album, currentTrackIndex, playTrack],
  );

  const handleLoadedMetadata = useCallback(
    (event: SyntheticEvent<HTMLAudioElement>) => {
      const duration = Number.isFinite(event.currentTarget.duration)
        ? event.currentTarget.duration
        : 0;
      setAudioDuration(duration);
      if (duration && restoreTimeRef.current > 0) {
        const restoredTime = Math.min(
          restoreTimeRef.current,
          Math.max(0, duration - 0.25),
        );
        event.currentTarget.currentTime = restoredTime;
        setProgress((restoredTime / duration) * 100);
        restoreTimeRef.current = 0;
      }
    },
    [],
  );

  const handleTimeUpdate = useCallback(
    (event: SyntheticEvent<HTMLAudioElement>) => {
      const audio = event.currentTarget;
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      setAudioDuration(duration);
      setProgress(duration ? (audio.currentTime / duration) * 100 : 0);

      const second = Math.floor(audio.currentTime);
      if (
        album &&
        second !== lastSavedSecondRef.current &&
        second % 2 === 0
      ) {
        lastSavedSecondRef.current = second;
        savePlayback(album.id, currentTrackIndex, audio.currentTime);
      }
    },
    [album, audioRef, currentTrackIndex, savePlayback],
  );

  const seek = useCallback(
    (nextProgress: number) => {
      setProgress(nextProgress);
      const audio = audioRef.current;
      if (!album || !audio?.duration) return;
      audio.currentTime = (nextProgress / 100) * audio.duration;
      savePlayback(album.id, currentTrackIndex, audio.currentTime);
    },
    [album, audioRef, currentTrackIndex, savePlayback],
  );

  const toggleSort = useCallback(() => {
    if (railPhase !== "idle") return;
    const exitTime = 80 + sortedAlbums.length * 28;
    const enterTime = 220 + sortedAlbums.length * 28;
    setRailPhase("exit");

    const exitTimer = setTimeout(() => {
      setSortBy((previous) =>
        previous === "date-desc" ? "date-asc" : "date-desc",
      );
      setAlbumIndex(0);
      setRailPhase("enter");
      const enterTimer = setTimeout(() => setRailPhase("idle"), enterTime);
      railTimersRef.current.push(enterTimer);
    }, exitTime);
    railTimersRef.current.push(exitTimer);
  }, [railPhase, sortedAlbums.length]);

  const time = useMemo(
    () => ({
      current: formatTime((progress / 100) * audioDuration),
      total: formatTime(audioDuration),
    }),
    [audioDuration, progress],
  );

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
    artistName,
    audioDuration,
    contentClass,
    currentTrackIndex,
    handleLoadedMetadata,
    handleTimeUpdate,
    hoveredDisc,
    isPlaying,
    loading,
    loadError,
    nextTrack: () => moveTrack(1),
    playTrack,
    previousTrack: () => moveTrack(-1),
    progress,
    railPhase,
    seek,
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
