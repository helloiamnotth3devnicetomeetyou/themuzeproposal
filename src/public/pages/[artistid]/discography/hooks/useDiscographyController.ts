"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { AlbumPreviewPayload } from "@/core/preview/types";
import { localizeText } from "@/core/i18n/localized";
import { useLocale } from "@/core/providers/LocaleContext";
import {
  usePlayer,
  type PlayerTrack,
} from "@/public/features/player/PlayerProvider";

import { savePlaybackMemory, syncAlbumQuery } from "../lib/playback-memory";
import type {
  AlbumSort,
  DiscographyData,
  DiscographyTab,
  RailPhase,
  SlideDirection,
} from "../lib/types";
import { previewToAlbum } from "./discography-controller-utils";
import { useDiscographyData } from "./useDiscographyData";
import { useDiscographyRailSort } from "./useDiscographyRailSort";

const ALBUM_TRANSITION_MS = 220;

function emptyTime() {
  return { current: "0:00", total: "0:00" };
}

export function useDiscographyController(
  artistSlug: string,
  albumRailRef: RefObject<HTMLDivElement | null>,
  preview: AlbumPreviewPayload | null,
  initialData: DiscographyData | null,
  initialLoadError: string | null,
) {
  const { locale } = useLocale();
  const player = usePlayer();
  const [transitioning, setTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<SlideDirection>(null);
  const [hoveredDisc, setHoveredDisc] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<DiscographyTab>("intro");
  const [sortBy, setSortBy] = useState<AlbumSort>("date-desc");
  const [railPhase, setRailPhase] = useState<RailPhase>("idle");
  const [showDiscs, setShowDiscs] = useState(false);
  const [localTrackIndex, setLocalTrackIndex] = useState(0);
  const restoreTimeRef = useRef(0);

  const albumTransitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const railTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

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
  } = useDiscographyData(
    artistSlug,
    setLocalTrackIndex,
    restoreTimeRef,
    initialData,
    initialLoadError,
  );

  const previewAlbum = useMemo(() => previewToAlbum(preview), [preview]);
  const effectiveAlbums = useMemo(() => {
    if (!previewAlbum) return albums;
    const exists = albums.some((item) => item.id === previewAlbum.id);
    return exists
      ? albums.map((item) =>
          item.id === previewAlbum.id ? previewAlbum : item,
        )
      : [...albums, previewAlbum];
  }, [albums, previewAlbum]);
  const sortedAlbums = useMemo(
    () =>
      effectiveAlbums
        .map((item) => ({
          ...item,
          title: localizeText(item.titles, locale, item.title),
          tracks: item.tracks.map((track) => ({
            ...track,
            title: localizeText(track.titles, locale, track.title),
          })),
        }))
        .sort((a, b) =>
          sortBy === "date-asc"
            ? (a.releaseDate || "").localeCompare(b.releaseDate || "")
            : (b.releaseDate || "").localeCompare(a.releaseDate || ""),
        ),
    [effectiveAlbums, locale, sortBy],
  );
  const localizedMembers = useMemo(
    () =>
      members.map((member) => ({
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

  const playerQueue = useMemo<PlayerTrack[]>(
    () =>
      album
        ? album.tracks.flatMap((track, albumTrackIndex) =>
            track.audioUrl
              ? [
                  {
                    id: track.id,
                    title: track.title,
                    audioUrl: track.audioUrl,
                    albumId: album.id,
                    albumTitle: album.title,
                    albumCover: album.cover,
                    albumColor: album.color,
                    artistSlug,
                    artistName:
                      preview?.artist.name ||
                      localizeText(artistNames || {}, locale, artistName),
                    albumTrackIndex,
                    youtubeUrl: track.youtubeUrl,
                  },
                ]
              : [],
          )
        : [],
    [album, artistName, artistNames, artistSlug, locale, preview?.artist.name],
  );

  const globalTrackMatchesAlbum = Boolean(
    album &&
    player.currentTrack?.artistSlug === artistSlug &&
    player.currentTrack.albumId === album.id,
  );
  const globalTrackIndex = globalTrackMatchesAlbum
    ? (player.currentTrack?.albumTrackIndex ?? -1)
    : -1;
  const currentTrackIndex =
    globalTrackIndex >= 0 ? globalTrackIndex : localTrackIndex;
  const isPlaying = globalTrackMatchesAlbum && player.isPlaying;
  const progress = globalTrackMatchesAlbum ? player.progress : 0;
  const time = globalTrackMatchesAlbum ? player.time : emptyTime();

  useEffect(() => {
    if (!globalTrackMatchesAlbum) return;
    const timer = window.setTimeout(() => setShowDiscs(true), 0);
    return () => window.clearTimeout(timer);
  }, [globalTrackMatchesAlbum]);

  const seek = useCallback(
    (nextProgress: number) => {
      if (globalTrackMatchesAlbum) player.seek(nextProgress);
    },
    [globalTrackMatchesAlbum, player],
  );

  const playTrack = useCallback(
    (index: number) => {
      const selected = album?.tracks[index];
      if (!album || !selected) return;
      setLocalTrackIndex(index);
      restoreTimeRef.current = 0;
      if (!selected.audioUrl) {
        setShowDiscs(false);
        if (globalTrackMatchesAlbum) player.clear();
        return;
      }
      const queueIndex = playerQueue.findIndex(
        (track) => track.albumTrackIndex === index,
      );
      if (queueIndex < 0) return;
      setShowDiscs(true);
      player.playTrack(playerQueue, queueIndex, 0);
      savePlayback(album.id, index, 0);
    },
    [album, globalTrackMatchesAlbum, player, playerQueue, savePlayback],
  );

  const togglePlay = useCallback(() => {
    const selected = album?.tracks[currentTrackIndex];
    if (!album || !selected?.audioUrl) return;
    if (globalTrackMatchesAlbum) {
      if (!player.isPlaying) setShowDiscs(true);
      player.togglePlay();
      return;
    }
    const queueIndex = playerQueue.findIndex(
      (track) => track.albumTrackIndex === currentTrackIndex,
    );
    if (queueIndex < 0) return;
    const rememberedTime = restoreTimeRef.current;
    restoreTimeRef.current = 0;
    setShowDiscs(true);
    player.playTrack(
      playerQueue,
      queueIndex,
      rememberedTime > 0 ? rememberedTime : undefined,
    );
  }, [album, currentTrackIndex, globalTrackMatchesAlbum, player, playerQueue]);

  const moveTrack = useCallback(
    (offset: number) => {
      if (!album?.tracks.length) return;
      if (globalTrackMatchesAlbum) {
        if (offset > 0) player.nextTrack();
        else player.previousTrack();
        return;
      }
      const playable = album.tracks.flatMap((track, index) =>
        track.audioUrl ? [index] : [],
      );
      if (!playable.length) return;
      const currentPlayableIndex = Math.max(
        0,
        playable.indexOf(currentTrackIndex),
      );
      const next =
        playable[
          (currentPlayableIndex + offset + playable.length) % playable.length
        ];
      playTrack(next);
    },
    [album, currentTrackIndex, globalTrackMatchesAlbum, playTrack, player],
  );
  const nextTrack = useCallback(() => moveTrack(1), [moveTrack]);
  const previousTrack = useCallback(() => moveTrack(-1), [moveTrack]);

  const switchAlbum = useCallback(
    (newIndex: number) => {
      if (newIndex === albumIndex || transitioning) return;
      const nextAlbum = sortedAlbums[newIndex];
      if (!nextAlbum) return;

      setSlideDirection(newIndex > albumIndex ? "left" : "right");
      setTransitioning(true);
      setShowDiscs(false);
      if (globalTrackMatchesAlbum) player.clear();
      setLocalTrackIndex(0);
      restoreTimeRef.current = 0;
      savePlayback(nextAlbum.id, 0, 0);
      syncAlbumQuery(nextAlbum.id);

      if (albumTransitionTimerRef.current)
        clearTimeout(albumTransitionTimerRef.current);
      albumTransitionTimerRef.current = setTimeout(() => {
        setAlbumIndex(newIndex);
        setLocalTrackIndex(0);
        setSlideDirection(null);
        setActiveTab("intro");
        requestAnimationFrame(() => setTransitioning(false));
      }, ALBUM_TRANSITION_MS);
    },
    [
      albumIndex,
      globalTrackMatchesAlbum,
      player,
      savePlayback,
      sortedAlbums,
      transitioning,
      setAlbumIndex,
    ],
  );

  useEffect(() => {
    const rail = albumRailRef.current;
    const current = rail?.querySelector<HTMLElement>(
      `[data-album-index="${albumIndex}"]`,
    );
    if (!rail || !current) return;
    const railRect = rail.getBoundingClientRect();
    const currentRect = current.getBoundingClientRect();
    const targetScrollLeft =
      rail.scrollLeft +
      currentRect.left -
      railRect.left -
      (rail.clientWidth - currentRect.width) / 2;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (typeof rail.scrollTo === "function") {
      rail.scrollTo({
        left: targetScrollLeft,
        behavior: reducedMotion ? "auto" : "smooth",
      });
    } else {
      rail.scrollLeft = targetScrollLeft;
    }
  }, [albumIndex, albumRailRef, sortedAlbums.length]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.closest(
          "input, textarea, select, button, a, [contenteditable='true']",
        )
      )
        return;
      if (event.key === "ArrowRight")
        switchAlbum(Math.min(albumIndex + 1, sortedAlbums.length - 1));
      if (event.key === "ArrowLeft") switchAlbum(Math.max(albumIndex - 1, 0));
      if (event.key === " " && album?.tracks[currentTrackIndex]?.audioUrl) {
        event.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    album,
    albumIndex,
    currentTrackIndex,
    sortedAlbums.length,
    switchAlbum,
    togglePlay,
  ]);

  useEffect(
    () => () => {
      if (albumTransitionTimerRef.current)
        clearTimeout(albumTransitionTimerRef.current);
      railTimersRef.current.forEach(clearTimeout);
    },
    [],
  );

  const runToggleSort = useDiscographyRailSort({
    railPhase,
    albumCount: sortedAlbums.length,
    railTimersRef,
    setRailPhase,
    setSortBy,
    setAlbumIndex,
  });
  const toggleSort = useCallback(() => {
    if (railPhase !== "idle") return;
    if (globalTrackMatchesAlbum) player.clear();
    setShowDiscs(false);
    runToggleSort();
  }, [globalTrackMatchesAlbum, player, railPhase, runToggleSort]);

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
    artistName:
      preview?.artist.name ||
      localizeText(artistNames || {}, locale, artistName),
    contentClass,
    currentTrackIndex,
    gallery,
    hoveredDisc,
    isPlaying,
    loading,
    loadError,
    members: localizedMembers,
    nextTrack,
    onSeek: seek,
    playTrack,
    previousTrack,
    progress,
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
