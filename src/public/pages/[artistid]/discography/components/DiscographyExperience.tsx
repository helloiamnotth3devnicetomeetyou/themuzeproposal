"use client";

import LoadingIndicator from "@/core/components/feedback/LoadingIndicator";
import { usePreviewPayload } from "@/core/preview/PreviewProvider";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useLocale } from "@/core/providers/LocaleContext";
import {
  preloadImages,
  scheduleImagePreload,
} from "@/core/utils/image-preload";
import { useDiscographyController } from "../hooks/useDiscographyController";
import {
  coverPreloadQueue,
  discographyCoverCandidate,
  galleryPreloadQueue,
} from "../lib/cover-preload";
import type { DiscographyData } from "../lib/types";
import { AlbumArtwork } from "./AlbumArtwork";
import { AlbumDetails } from "./AlbumDetails";
import { AlbumDock } from "./AlbumDock";
import { DiscographyBackground } from "./DiscographyBackground";

const MobileDiscographyPlayer = dynamic(() =>
  import("./MobileDiscographyPlayer").then(
    ({ MobileDiscographyPlayer }) => MobileDiscographyPlayer,
  ),
);

export function DiscographyExperience({
  artistSlug,
  initialData = null,
  initialLoadError = null,
}: {
  artistSlug: string;
  initialData?: DiscographyData | null;
  initialLoadError?: string | null;
}) {
  const { locale, t } = useLocale();
  const preview = usePreviewPayload("album");
  const albumRailRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLElement>(null);
  const [mobileView, setMobileView] = useState<"album" | "tracks">("album");
  const [isMobileExperience, setIsMobileExperience] = useState<boolean | null>(
    null,
  );
  const discography = useDiscographyController(
    artistSlug,
    albumRailRef,
    preview,
    initialData,
    initialLoadError,
  );
  const coverCandidates = useMemo(
    () =>
      discography.sortedAlbums.map((album) =>
        discographyCoverCandidate(album.cover),
      ),
    [discography.sortedAlbums],
  );

  const queuedCoverCandidates = useMemo(
    () => coverPreloadQueue(coverCandidates, discography.albumIndex),
    [coverCandidates, discography.albumIndex],
  );
  const queuedGalleryCandidates = useMemo(
    () => galleryPreloadQueue(discography.gallery, discography.album?.id),
    [discography.album?.id, discography.gallery],
  );

  useEffect(() => {
    void preloadImages(queuedCoverCandidates, { concurrency: 2 });
  }, [queuedCoverCandidates]);

  useEffect(
    () => scheduleImagePreload(queuedGalleryCandidates, { concurrency: 3 }),
    [queuedGalleryCandidates],
  );

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsMobileExperience(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const preloadAlbum = useCallback(
    (index: number) => {
      const candidate = coverCandidates[index];
      if (candidate) void preloadImages([candidate]);
    },
    [coverCandidates],
  );
  const toggleDiscs = useCallback(
    () => discography.setShowDiscs((showDiscs) => !showDiscs),
    [discography],
  );

  const changeMobileView = useCallback((view: "album" | "tracks") => {
    setMobileView(view);
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    requestAnimationFrame(() =>
      pageRef.current?.scrollTo({
        top: 0,
        behavior: reducedMotion ? "auto" : "smooth",
      }),
    );
  }, []);

  if (
    discography.loading ||
    !discography.album ||
    isMobileExperience === null
  ) {
    const waiting = discography.loading || isMobileExperience === null;
    const message =
      discography.loadError ||
      (waiting ? t.discography.loading : t.discography.empty);

    return (
      <main
        className="min-h-[100dvh] flex items-center justify-center px-6"
        style={{ backgroundColor: "var(--palette-050505)" }}
      >
        {waiting ? (
          <LoadingIndicator
            label={message}
            className="text-[var(--palette-9ca3af)]"
          />
        ) : (
          <p className="text-sm text-[var(--palette-9ca3af)]">{message}</p>
        )}
      </main>
    );
  }

  const { album } = discography;

  return (
    <main
      ref={pageRef}
      className="h-[100dvh] w-full relative overflow-x-hidden overflow-y-auto overscroll-y-contain scrollbar-none lg:overflow-hidden flex flex-col"
      style={{ backgroundColor: "var(--palette-050505)" }}
    >
      <DiscographyBackground album={album} isPlaying={discography.isPlaying} />

      {isMobileExperience ? (
        <div className="w-full max-w-[640px] md:max-w-none mx-auto px-5 md:px-8 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(var(--banner-height,0px)+var(--site-header-height))] relative z-10">
          <MobileDiscographyPlayer
            album={album}
            albumIndex={discography.albumIndex}
            albums={discography.sortedAlbums}
            artistName={discography.artistName}
            currentTrackIndex={discography.currentTrackIndex}
            gallery={discography.gallery}
            hoveredDisc={discography.hoveredDisc}
            isPlaying={discography.isPlaying}
            locale={locale}
            members={discography.members}
            progress={discography.progress}
            time={discography.time}
            view={mobileView}
            onIntentAlbum={preloadAlbum}
            onNextTrack={discography.nextTrack}
            onPlayTrack={discography.playTrack}
            onPreviousTrack={discography.previousTrack}
            onSelectAlbum={discography.switchAlbum}
            onSeek={discography.onSeek}
            onTogglePlay={discography.togglePlay}
            onViewChange={changeMobileView}
          />
        </div>
      ) : (
        <div
          className={`grid flex-1 min-h-0 grid-cols-12 items-center max-w-[1400px] mx-auto px-8 pb-8 w-full relative z-10 overflow-visible pt-28 gap-8 ${discography.contentClass}`}
        >
          <AlbumArtwork
            album={album}
            artistName={discography.artistName}
            currentTrackIndex={discography.currentTrackIndex}
            hoveredDisc={discography.hoveredDisc}
            isPlaying={discography.isPlaying}
            showDiscs={discography.showDiscs}
            onHoverDisc={discography.setHoveredDisc}
            onSelectTrack={discography.playTrack}
            onToggleDiscs={toggleDiscs}
          />
          <AlbumDetails
            activeTab={discography.activeTab}
            album={album}
            currentTrackIndex={discography.currentTrackIndex}
            hoveredDisc={discography.hoveredDisc}
            isPlaying={discography.isPlaying}
            locale={locale}
            members={discography.members}
            progress={discography.progress}
            gallery={discography.gallery}
            time={discography.time}
            onNextTrack={discography.nextTrack}
            onPlayTrack={discography.playTrack}
            onPreviousTrack={discography.previousTrack}
            onSeek={discography.onSeek}
            onTabChange={discography.setActiveTab}
            onTogglePlay={discography.togglePlay}
          />
        </div>
      )}

      {!isMobileExperience && (
        <AlbumDock
          albumIndex={discography.albumIndex}
          albums={discography.sortedAlbums}
          currentAlbum={album}
          railPhase={discography.railPhase}
          railRef={albumRailRef}
          sortBy={discography.sortBy}
          onIntentAlbum={preloadAlbum}
          onSelectAlbum={discography.switchAlbum}
          onToggleSort={discography.toggleSort}
        />
      )}
    </main>
  );
}
