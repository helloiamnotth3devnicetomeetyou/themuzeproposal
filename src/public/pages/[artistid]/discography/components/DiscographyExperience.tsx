"use client";

import LoadingIndicator from "@/core/components/feedback/LoadingIndicator";
import { usePreviewPayload } from "@/core/preview/PreviewProvider";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, type TouchEvent } from "react";

import { useLocale } from "@/core/providers/LocaleContext";
import { preloadImages, scheduleImagePreload } from "@/core/utils/image-preload";
import { useDiscographyController } from "../hooks/useDiscographyController";
import { discographyCoverCandidate } from "../lib/cover-preload";
import { AlbumArtwork } from "./AlbumArtwork";
import { AlbumDetails } from "./AlbumDetails";
import { AlbumDock } from "./AlbumDock";
import { DiscographyBackground } from "./DiscographyBackground";

export function DiscographyExperience() {
  const { locale, t } = useLocale();
  const { artistid } = useParams<{ artistid: string }>();
  const preview = usePreviewPayload("album");
  const audioRef = useRef<HTMLAudioElement>(null);
  const albumRailRef = useRef<HTMLDivElement>(null);
  const albumSwipeStart = useRef<{ x: number; y: number } | null>(null);
  const discography = useDiscographyController(
    artistid,
    audioRef,
    albumRailRef,
    preview,
  );
  const coverCandidates = useMemo(
    () => discography.sortedAlbums.map((album) => discographyCoverCandidate(album.cover)),
    [discography.sortedAlbums],
  );

  useEffect(() => scheduleImagePreload(
    coverCandidates.filter((_, index) => index !== discography.albumIndex),
    { concurrency: 2 },
  ), [coverCandidates, discography.albumIndex]);

  const preloadAlbum = useCallback((index: number) => {
    const candidate = coverCandidates[index];
    if (candidate) void preloadImages([candidate]);
  }, [coverCandidates]);
  const startAlbumSwipe = (event: TouchEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button, a, input")) return;
    const touch = event.touches[0];
    if (touch) albumSwipeStart.current = { x: touch.clientX, y: touch.clientY };
  };
  const endAlbumSwipe = (event: TouchEvent<HTMLDivElement>) => {
    const start = albumSwipeStart.current;
    albumSwipeStart.current = null;
    const touch = event.changedTouches[0];
    if (!start || !touch) return;
    const x = touch.clientX - start.x;
    const y = touch.clientY - start.y;
    if (Math.abs(x) < 56 || Math.abs(x) <= Math.abs(y)) return;
    discography.switchAlbum(Math.max(0, Math.min(discography.sortedAlbums.length - 1, discography.albumIndex + (x < 0 ? 1 : -1))));
  };

  if (discography.loading || !discography.album) {
    const message =
      discography.loadError ||
      (discography.loading
        ? t.discography.loading
        : t.discography.empty);

    return (
      <main
        className="min-h-[100dvh] flex items-center justify-center px-6"
        style={{ backgroundColor: "var(--palette-050505)" }}
      >
        {discography.loading ? (
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
      className="h-[100dvh] w-full relative overflow-hidden flex flex-col"
      style={{ backgroundColor: "var(--palette-050505)" }}
    >
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={discography.handleLoadedMetadata}
        onTimeUpdate={discography.handleTimeUpdate}
        onEnded={discography.handleEnded}
      />

      <DiscographyBackground
        album={album}
        isPlaying={discography.isPlaying}
      />

      <div
        className={`flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 items-start lg:items-center max-w-[1400px] mx-auto px-5 sm:px-8 pb-8 w-full relative z-10 overflow-y-auto lg:overflow-visible pt-24 lg:pt-28 gap-7 lg:gap-8 ${discography.contentClass}`}
        onTouchStart={startAlbumSwipe}
        onTouchEnd={endAlbumSwipe}
        onTouchCancel={() => { albumSwipeStart.current = null; }}
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
          onToggleDiscs={() =>
            discography.setShowDiscs((showDiscs) => !showDiscs)
          }
        />
        <AlbumDetails
          activeTab={discography.activeTab}
          album={album}
          audioDuration={discography.audioDuration}
          currentTrackIndex={discography.currentTrackIndex}
          hoveredDisc={discography.hoveredDisc}
          isPlaying={discography.isPlaying}
          locale={locale}
          members={discography.members}
          gallery={discography.gallery}
          progress={discography.progress}
          time={discography.time}
          onNextTrack={discography.nextTrack}
          onPlayTrack={discography.playTrack}
          onPreviousTrack={discography.previousTrack}
          onSeek={discography.seek}
          onTabChange={discography.setActiveTab}
          onTogglePlay={discography.togglePlay}
        />
      </div>

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
    </main>
  );
}
