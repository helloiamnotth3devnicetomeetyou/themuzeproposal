"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import type { CSSProperties } from "react";
import { sanitizeRichText } from "@/core/utils/rich-text";
import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";
import type { ArtistScene } from "@/core/utils/artist-scenes";
import SceneCanvas from "./SceneCanvas";
import SceneDock from "./SceneDock";
import type { Artist, Member, SceneCopy } from "./artist-scene-types";
import styles from "@/styles/(public)/pages/artist-scene.module.css";

const MemberDetailOverlay = dynamic(() => import("./MemberDetailOverlay"));

type Props = {
  artist: Artist;
  artistName: string;
  activeScene: ArtistScene;
  localizedScene: ArtistScene;
  members: Member[];
  memberScenes: ArtistScene[];
  selectedMember: Member | null;
  memberBio: string;
  groupFocused: boolean;
  focusMemberId: string | null;
  selectedRegionCentroid: { x: number; y: number };
  groupBio: string;
  copy: SceneCopy;
  showReset: boolean;
  onClose: () => void;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onToggleGroup: () => void;
  onNavigate: (direction: -1 | 1) => void;
  onChangeScene: (id: string) => void;
  onReset: () => void;
};

export default function DesktopArtistScene({
  artist,
  artistName,
  activeScene,
  localizedScene,
  members,
  memberScenes,
  selectedMember,
  memberBio,
  groupFocused,
  focusMemberId,
  selectedRegionCentroid,
  groupBio,
  copy,
  showReset,
  onClose,
  onHover,
  onSelect,
  onToggleGroup,
  onNavigate,
  onChangeScene,
  onReset,
}: Props) {
  return (
    <main
      className={`${styles.experience} ${selectedMember || groupFocused ? styles.hasSelection : ""}`}
      style={
        {
          "--artist-accent":
            selectedMember?.color || artist.color || BRAND_PINK_HEX,
        } as CSSProperties
      }
    >
      {!selectedMember && !groupFocused && (
        <div className={styles.clickHint}>{copy.clickHint}</div>
      )}
      <SceneCanvas
        scene={localizedScene}
        members={members}
        artistName={artistName}
        sceneLabel={copy.scene}
        focusMemberId={focusMemberId}
        groupFocused={groupFocused}
        selectedMember={Boolean(selectedMember)}
        cameraOffset={{
          x: (50 - selectedRegionCentroid.x) * 0.14,
          y: (50 - selectedRegionCentroid.y) * 0.1,
        }}
        onClose={onClose}
        onHover={onHover}
        onSelect={onSelect}
      />
      {!selectedMember && (
        <div
          className={`${styles.artistIdentity} ${groupFocused ? styles.artistIdentityFocused : ""}`}
        >
          <button
            type="button"
            className={styles.artistWordmark}
            onClick={(event) => {
              event.stopPropagation();
              onToggleGroup();
            }}
            aria-label={`${artistName} ${copy.profile}`}
            aria-expanded={groupFocused}
            aria-controls={groupBio ? "group-artist-bio" : undefined}
          >
            {artist.logo_url && (
              <Image
                src={artist.logo_url}
                alt={`${artistName} logo`}
                width={240}
                height={80}
              />
            )}
            <h1>{artistName}</h1>
            <span className={styles.artistProfileToggle} aria-hidden="true" />
          </button>
          {groupBio && (
            <div
              id="group-artist-bio"
              className={styles.artistBioReveal}
              aria-hidden={!groupFocused}
            >
              <div
                dangerouslySetInnerHTML={{ __html: sanitizeRichText(groupBio) }}
              />
            </div>
          )}
        </div>
      )}
      {selectedMember && (
        <MemberDetailOverlay
          member={selectedMember}
          memberBio={memberBio}
          panelLeft={selectedRegionCentroid.x > 56}
          copy={copy}
          onClose={onClose}
          onNavigate={onNavigate}
        />
      )}
      <SceneDock
        artist={artist}
        member={selectedMember}
        scenes={memberScenes}
        activeSceneId={activeScene.id}
        copy={copy}
        showReset={showReset}
        onChangeScene={onChangeScene}
        onReset={onReset}
      />
      <div
        className={styles.sceneSweep}
        key={`sweep-${activeScene.id}`}
        aria-hidden="true"
      />
    </main>
  );
}
