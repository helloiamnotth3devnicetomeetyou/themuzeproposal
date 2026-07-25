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

type SavePlayback = (albumId: string, trackIndex: number, currentTime: number) => void;

export interface AudioPlaybackState {
  isPlaying: boolean;
  progress: number;
  audioDuration: number;
  showDiscs: boolean;
  currentTrackIndex: number;
  time: { current: string; total: string };
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  setProgress: React.Dispatch<React.SetStateAction<number>>;
  setAudioDuration: React.Dispatch<React.SetStateAction<number>>;
  setShowDiscs: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentTrackIndex: React.Dispatch<React.SetStateAction<number>>;
  restoreTimeRef: React.MutableRefObject<number>;
  lastSavedSecondRef: React.MutableRefObject<number>;
  handleLoadedMetadata: (event: SyntheticEvent<HTMLAudioElement>) => void;
  handleTimeUpdate: (
    event: SyntheticEvent<HTMLAudioElement>,
    albumId: string | undefined,
    currentTrackIndex: number,
    savePlayback: SavePlayback,
  ) => void;
  seek: (
    nextProgress: number,
    audioRef: RefObject<HTMLAudioElement | null>,
    albumId: string | undefined,
    currentTrackIndex: number,
    savePlayback: SavePlayback,
  ) => void;
}

function formatTime(seconds: number) {
  const wholeSeconds = Math.floor(seconds);
  return `${Math.floor(wholeSeconds / 60)}:${(wholeSeconds % 60)
    .toString()
    .padStart(2, "0")}`;
}

export function useAudioPlayback(
  audioRef: RefObject<HTMLAudioElement | null>,
  initialTrackIndex = 0,
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [showDiscs, setShowDiscs] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(initialTrackIndex);

  const restoreTimeRef = useRef(0);
  const lastSavedSecondRef = useRef(-1);

  const time = useMemo(
    () => ({
      current: formatTime((progress / 100) * audioDuration),
      total: formatTime(audioDuration),
    }),
    [audioDuration, progress],
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
    (
      event: SyntheticEvent<HTMLAudioElement>,
      albumId: string | undefined,
      trackIndex: number,
      savePlayback: SavePlayback,
    ) => {
      const audio = event.currentTarget;
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      setAudioDuration(duration);
      setProgress(duration ? (audio.currentTime / duration) * 100 : 0);

      const second = Math.floor(audio.currentTime);
      if (albumId && second !== lastSavedSecondRef.current && second % 2 === 0) {
        lastSavedSecondRef.current = second;
        savePlayback(albumId, trackIndex, audio.currentTime);
      }
    },
    [],
  );

  const seek = useCallback(
    (
      nextProgress: number,
      ref: RefObject<HTMLAudioElement | null>,
      albumId: string | undefined,
      trackIndex: number,
      savePlayback: SavePlayback,
    ) => {
      setProgress(nextProgress);
      const audio = ref.current;
      if (!albumId || !audio?.duration) return;
      audio.currentTime = (nextProgress / 100) * audio.duration;
      savePlayback(albumId, trackIndex, audio.currentTime);
    },
    [],
  );

  // Sync audio element src + play/pause
  useEffect(() => {
    // The parent hook drives src changes; this hook just exposes state.
    // Actual src management stays in useDiscographyController for album context.
  }, []);

  return {
    isPlaying,
    progress,
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
    lastSavedSecondRef,
    handleLoadedMetadata,
    handleTimeUpdate,
    seek,
  };
}
