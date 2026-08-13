"use client";

import { useEffect, useState, type MutableRefObject } from "react";
import type { LocalizedText } from "@/core/i18n/localized";
import {
  readPlaybackMemory,
  requestedAlbumId,
  syncAlbumQuery,
} from "../lib/playback-memory";
import type {
  DiscographyAlbum,
  DiscographyData,
  DiscographyGalleryItem,
  DiscographyMember,
} from "../lib/types";
import { newestAlbumsFirst } from "../lib/album-order";

export function useDiscographyData(
  artistSlug: string,
  setCurrentTrackIndex: (index: number) => void,
  restoreTimeRef: MutableRefObject<number>,
  initialData: DiscographyData | null,
  initialLoadError: string | null,
) {
  const [albums, setAlbums] = useState<DiscographyAlbum[]>(() =>
    newestAlbumsFirst(initialData?.albums ?? []),
  );
  const [members, setMembers] = useState<DiscographyMember[]>(
    () => initialData?.members ?? [],
  );
  const [gallery, setGallery] = useState<DiscographyGalleryItem[]>(
    () => initialData?.gallery ?? [],
  );
  const [artistName, setArtistName] = useState(
    () => initialData?.artistName ?? "",
  );
  const [artistNames, setArtistNames] = useState<LocalizedText | null>(
    () => initialData?.artistNames ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(initialLoadError);
  const [albumIndex, setAlbumIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    function load() {
      const result = initialData;
      const orderedAlbums = newestAlbumsFirst(result?.albums ?? []);
      setLoading(false);
      setLoadError(initialLoadError);
      setAlbums(orderedAlbums);
      setMembers(result?.members ?? []);
      setGallery(result?.gallery ?? []);
      setArtistName(result?.artistName ?? "");
      setArtistNames(result?.artistNames ?? null);
      setAlbumIndex(0);
      setCurrentTrackIndex(0);
      restoreTimeRef.current = 0;

      if (!result) return;

      setLoadError(null);
      const requestedId = requestedAlbumId();
      const remembered = readPlaybackMemory(artistSlug);
      const requestedIndex = requestedId
        ? orderedAlbums.findIndex((item) => item.id === requestedId)
        : -1;
      const rememberedIndex = remembered
        ? orderedAlbums.findIndex((item) => item.id === remembered.albumId)
        : -1;
      const nextAlbumIndex =
        requestedIndex >= 0
          ? requestedIndex
          : rememberedIndex >= 0
            ? rememberedIndex
            : 0;
      const rememberedAlbumMatches = Boolean(
        remembered && orderedAlbums[nextAlbumIndex]?.id === remembered.albumId,
      );
      const trackCount = orderedAlbums[nextAlbumIndex]?.tracks.length ?? 0;
      const rememberedTrackIndex = rememberedAlbumMatches
        ? Math.max(
            0,
            Math.min(remembered?.trackIndex ?? 0, Math.max(0, trackCount - 1)),
          )
        : 0;

      if (cancelled) return;
      setAlbumIndex(nextAlbumIndex);
      setCurrentTrackIndex(rememberedTrackIndex);
      restoreTimeRef.current = rememberedAlbumMatches
        ? Math.max(0, remembered?.currentTime ?? 0)
        : 0;
      if (orderedAlbums[nextAlbumIndex])
        syncAlbumQuery(orderedAlbums[nextAlbumIndex].id);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [
    artistSlug,
    initialData,
    initialLoadError,
    restoreTimeRef,
    setCurrentTrackIndex,
  ]);

  return {
    albumIndex,
    artistName,
    artistNames,
    albums,
    gallery,
    loading,
    loadError,
    members,
    setAlbumIndex,
  };
}
