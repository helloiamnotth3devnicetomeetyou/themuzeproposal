"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  readPlaybackMemory,
  savePlaybackMemory,
} from "@/public/pages/[artistid]/discography/lib/playback-memory";

export interface PlayerTrack {
  id: string;
  title: string;
  audioUrl: string;
  albumId: string;
  albumTitle: string;
  albumCover: string;
  albumColor: string;
  artistSlug: string;
  artistName: string;
  /** Index in the source album, not the filtered playable queue. */
  albumTrackIndex: number;
  youtubeUrl?: string;
}

export interface PlayerState {
  queue: PlayerTrack[];
  currentTrackIndex: number;
  currentTrack: PlayerTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  time: { current: string; total: string };
}

export interface PlayerContextValue extends PlayerState {
  playTrack: (queue: PlayerTrack[], index: number, startTime?: number) => void;
  togglePlay: () => void;
  previousTrack: () => void;
  nextTrack: () => void;
  /** Seeks using the same 0–100 value exposed by `progress`. */
  seek: (progress: number) => void;
  clear: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

function formatTime(seconds: number) {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  return `${Math.floor(wholeSeconds / 60)}:${String(wholeSeconds % 60).padStart(2, "0")}`;
}

function clampTime(value: number, duration: number) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return duration > 0 ? Math.min(value, Math.max(0, duration - 0.25)) : value;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<PlayerTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const queueRef = useRef<PlayerTrack[]>([]);
  const currentIndexRef = useRef(-1);
  const trackRef = useRef<PlayerTrack | null>(null);
  const pendingStartTimeRef = useRef<number | null>(null);
  const lastSavedSecondRef = useRef(-1);
  const loadedTrackIdRef = useRef<string | null>(null);

  const currentTrack = queue[currentTrackIndex] ?? null;
  const progress = duration ? Math.min(100, (currentTime / duration) * 100) : 0;
  const time = useMemo(
    () => ({ current: formatTime(currentTime), total: formatTime(duration) }),
    [currentTime, duration],
  );

  useEffect(() => {
    queueRef.current = queue;
    currentIndexRef.current = currentTrackIndex;
    trackRef.current = currentTrack;
  }, [currentTrack, currentTrackIndex, queue]);

  const saveCurrentPlayback = useCallback(
    (atTime = audioRef.current?.currentTime ?? 0) => {
      const track = trackRef.current;
      if (!track) return;
      savePlaybackMemory(track.artistSlug, {
        albumId: track.albumId,
        trackIndex: track.albumTrackIndex,
        currentTime: Math.max(0, atTime),
      });
    },
    [],
  );

  const playTrack = useCallback(
    (nextQueue: PlayerTrack[], index: number, startTime?: number) => {
      const selected = nextQueue[index];
      if (!selected?.audioUrl) return;

      const remembered =
        startTime === undefined
          ? readPlaybackMemory(selected.artistSlug)
          : null;
      const rememberedTime =
        remembered &&
        remembered.albumId === selected.albumId &&
        remembered.trackIndex === selected.albumTrackIndex
          ? remembered.currentTime
          : 0;
      pendingStartTimeRef.current = clampTime(
        startTime === undefined ? rememberedTime : startTime,
        0,
      );
      lastSavedSecondRef.current = -1;
      setQueue(nextQueue);
      setCurrentTrackIndex(index);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(true);
    },
    [],
  );

  const togglePlay = useCallback(() => {
    if (!trackRef.current) return;
    setIsPlaying((playing) => !playing);
  }, []);

  const moveTrack = useCallback((offset: number) => {
    const tracks = queueRef.current;
    if (!tracks.length || currentIndexRef.current < 0) return;
    const nextIndex =
      (currentIndexRef.current + offset + tracks.length) % tracks.length;
    pendingStartTimeRef.current = 0;
    lastSavedSecondRef.current = -1;
    setCurrentTrackIndex(nextIndex);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);
  }, []);

  const previousTrack = useCallback(() => moveTrack(-1), [moveTrack]);
  const nextTrack = useCallback(() => moveTrack(1), [moveTrack]);

  const seek = useCallback(
    (nextProgress: number) => {
      const audio = audioRef.current;
      const normalized = Math.max(0, Math.min(100, nextProgress));
      if (!audio || !duration) return;
      const nextTime = (normalized / 100) * duration;
      audio.currentTime = nextTime;
      setCurrentTime(nextTime);
      saveCurrentPlayback(nextTime);
    },
    [duration, saveCurrentPlayback],
  );

  const clear = useCallback(() => {
    const audio = audioRef.current;
    audio?.pause();
    if (audio) {
      audio.removeAttribute("src");
      audio.load();
    }
    loadedTrackIdRef.current = null;
    pendingStartTimeRef.current = null;
    setQueue([]);
    setCurrentTrackIndex(-1);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentTrack) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      loadedTrackIdRef.current = null;
      return;
    }

    const sourceChanged =
      loadedTrackIdRef.current !== currentTrack.id ||
      audio.getAttribute("src") !== currentTrack.audioUrl;
    if (sourceChanged) {
      audio.pause();
      loadedTrackIdRef.current = currentTrack.id;
      audio.src = currentTrack.audioUrl;
      audio.load();
      setCurrentTime(0);
      setDuration(0);
    }

    if (pendingStartTimeRef.current !== null && audio.readyState >= 1) {
      const restoredTime = clampTime(
        pendingStartTimeRef.current,
        audio.duration || 0,
      );
      audio.currentTime = restoredTime;
      setCurrentTime(restoredTime);
      pendingStartTimeRef.current = null;
    }

    if (isPlaying) {
      void audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [currentTrack, isPlaying]);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextDuration = Number.isFinite(audio.duration) ? audio.duration : 0;
    setDuration(nextDuration);
    if (pendingStartTimeRef.current !== null) {
      const restoredTime = clampTime(pendingStartTimeRef.current, nextDuration);
      audio.currentTime = restoredTime;
      setCurrentTime(restoredTime);
      pendingStartTimeRef.current = null;
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextDuration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const nextTime = Math.max(0, audio.currentTime);
    setDuration(nextDuration);
    setCurrentTime(nextTime);
    const second = Math.floor(nextTime);
    if (second % 2 === 0 && second !== lastSavedSecondRef.current) {
      lastSavedSecondRef.current = second;
      saveCurrentPlayback(nextTime);
    }
  }, [saveCurrentPlayback]);

  const handleEnded = useCallback(() => {
    const tracks = queueRef.current;
    const index = currentIndexRef.current;
    const track = trackRef.current;
    if (!track || !tracks.length || index < 0) return;
    saveCurrentPlayback(0);
    if (index < tracks.length - 1) {
      pendingStartTimeRef.current = 0;
      lastSavedSecondRef.current = -1;
      setCurrentTrackIndex(index + 1);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(true);
      return;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  }, [saveCurrentPlayback]);

  useEffect(() => {
    const remember = () => saveCurrentPlayback();
    window.addEventListener("pagehide", remember);
    return () => window.removeEventListener("pagehide", remember);
  }, [saveCurrentPlayback]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      queue,
      currentTrackIndex,
      currentTrack,
      isPlaying,
      currentTime,
      duration,
      progress,
      time,
      playTrack,
      togglePlay,
      previousTrack,
      nextTrack,
      seek,
      clear,
    }),
    [
      clear,
      currentTime,
      currentTrack,
      currentTrackIndex,
      duration,
      isPlaying,
      nextTrack,
      playTrack,
      previousTrack,
      progress,
      queue,
      seek,
      time,
      togglePlay,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        className="hidden"
        aria-hidden="true"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context)
    throw new Error("usePlayer must be used within a PlayerProvider");
  return context;
}
