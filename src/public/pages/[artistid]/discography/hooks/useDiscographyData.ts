"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { useLocale } from "@/core/providers/LocaleContext";
import type { LocalizedText } from "@/core/i18n/localized";
import { fetchDiscography } from "../lib/discography-data";
import { readPlaybackMemory, requestedAlbumId, syncAlbumQuery } from "../lib/playback-memory";
import type { DiscographyAlbum, DiscographyGalleryItem, DiscographyMember } from "../lib/types";
import { newestAlbumsFirst } from "../lib/album-order";

export function useDiscographyData(
  artistSlug: string,
  setCurrentTrackIndex: (index: number) => void,
  restoreTimeRef: MutableRefObject<number>,
) {
  const { t } = useLocale();
  const [albums, setAlbums] = useState<DiscographyAlbum[]>([]);
  const [members, setMembers] = useState<DiscographyMember[]>([]);
  const [gallery, setGallery] = useState<DiscographyGalleryItem[]>([]);
  const [artistName, setArtistName] = useState("");
  const [artistNames, setArtistNames] = useState<LocalizedText | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [albumIndex, setAlbumIndex] = useState(0);
  const loadErrorMessageRef = useRef(t.discography.loadError);

  useEffect(() => {
    loadErrorMessageRef.current = t.discography.loadError;
  }, [t.discography.loadError]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      setAlbums([]);
      setMembers([]);
      setGallery([]);
      setArtistName("");
      setArtistNames(null);
      setAlbumIndex(0);

      try {
        const result = await fetchDiscography(artistSlug);
        if (cancelled) return;

        const orderedAlbums = newestAlbumsFirst(result.albums);
        const requestedId = requestedAlbumId();
        const remembered = readPlaybackMemory(artistSlug);
        const requestedIndex = requestedId ? orderedAlbums.findIndex((item) => item.id === requestedId) : -1;
        const rememberedIndex = remembered ? orderedAlbums.findIndex((item) => item.id === remembered.albumId) : -1;
        const nextAlbumIndex = requestedIndex >= 0 ? requestedIndex : rememberedIndex >= 0 ? rememberedIndex : 0;
        const rememberedAlbumMatches = Boolean(remembered && orderedAlbums[nextAlbumIndex]?.id === remembered.albumId);
        const trackCount = orderedAlbums[nextAlbumIndex]?.tracks.length ?? 0;
        const rememberedTrackIndex = rememberedAlbumMatches
          ? Math.max(0, Math.min(remembered?.trackIndex ?? 0, Math.max(0, trackCount - 1)))
          : 0;

        setArtistName(result.artistName);
        setArtistNames(result.artistNames);
        setAlbums(orderedAlbums);
        setMembers(result.members);
        setGallery(result.gallery);
        setAlbumIndex(nextAlbumIndex);
        setCurrentTrackIndex(rememberedTrackIndex);
        restoreTimeRef.current = rememberedAlbumMatches ? Math.max(0, remembered?.currentTime ?? 0) : 0;
        if (orderedAlbums[nextAlbumIndex]) syncAlbumQuery(orderedAlbums[nextAlbumIndex].id);
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : loadErrorMessageRef.current);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [artistSlug, restoreTimeRef, setCurrentTrackIndex]);

  return { albumIndex, artistName, artistNames, albums, gallery, loading, loadError, members, setAlbumIndex };
}
