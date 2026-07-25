"use client";

import LoadingIndicator from "@/core/components/feedback/LoadingIndicator";
import { useParams } from "next/navigation";
import { useRef } from "react";

import { useLocale } from "@/core/providers/LocaleContext";
import { useDiscographyController } from "../hooks/useDiscographyController";
import { AlbumArtwork } from "./AlbumArtwork";
import { AlbumDetails } from "./AlbumDetails";
import { AlbumDock } from "./AlbumDock";
import { DiscographyBackground } from "./DiscographyBackground";

export function DiscographyExperience() {
  const { locale } = useLocale();
  const { artistid } = useParams<{ artistid: string }>();
  const audioRef = useRef<HTMLAudioElement>(null);
  const albumRailRef = useRef<HTMLDivElement>(null);
  const discography = useDiscographyController(
    artistid,
    audioRef,
    albumRailRef,
  );

  if (discography.loading || !discography.album) {
    const message =
      discography.loadError ||
      (discography.loading
        ? "디스코그래피를 불러오는 중입니다."
        : "공개된 앨범이 없습니다.");

    return (
      <main
        className="min-h-screen flex items-center justify-center px-6"
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
      className="h-screen w-full relative overflow-hidden flex flex-col"
      style={{ backgroundColor: "var(--palette-050505)" }}
    >
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={discography.handleLoadedMetadata}
        onTimeUpdate={discography.handleTimeUpdate}
        onEnded={discography.nextTrack}
      />

      <DiscographyBackground
        album={album}
        isPlaying={discography.isPlaying}
      />

      <div
        className={`flex-1 grid grid-cols-1 lg:grid-cols-12 items-center max-w-[1400px] mx-auto px-8 w-full relative z-10 overflow-visible pt-28 gap-8 ${discography.contentClass}`}
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
        onSelectAlbum={discography.switchAlbum}
        onToggleSort={discography.toggleSort}
      />
    </main>
  );
}
