"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, type CSSProperties } from "react";
import { Disc3, ExternalLink } from "lucide-react";
import { normalizeSceneLink, type ArtistScene } from "@/core/utils/artist-scenes";
import type { Locale } from "@/core/i18n/translations";
import type { Artist, Member, SceneCopy } from "./artist-scene-types";
import MobileSceneControls from "./MobileSceneControls";
import MobileSceneRail from "./MobileSceneRail";
import styles from "@/styles/(public)/pages/artist-scene.module.css";

type Props = {
  artist: Artist;
  artistName: string;
  groupBio: string;
  members: Member[];
  scenes: ArtistScene[];
  activeSceneId: string;
  selectedMember: Member | null;
  memberBio: string;
  locale: Locale;
  copy: SceneCopy;
  onChangeScene: (id: string) => void;
  onSelectMember: (id: string) => void;
  onCloseMember: () => void;
  onNavigateMember: (direction: -1 | 1) => void;
};

export default function MobileArtistScene({
  artist,
  artistName,
  groupBio,
  members,
  scenes,
  activeSceneId,
  selectedMember,
  memberBio,
  locale,
  copy,
  onChangeScene,
  onSelectMember,
  onCloseMember,
  onNavigateMember,
}: Props) {
  const activeScene =
    scenes.find((scene) => scene.id === activeSceneId) ?? scenes[0];
  const activeIndex = Math.max(
    0,
    scenes.findIndex((scene) => scene.id === activeScene?.id),
  );
  const activeMembers = useMemo(() => {
    const tagged = members.filter((member) =>
      activeScene?.artist_scene_members?.some(
        (region) => region.member_id === member.id,
      ),
    );
    return tagged.length ? tagged : members;
  }, [activeScene, members]);
  const activeLink = normalizeSceneLink(activeScene?.link_url);
  const isExternalLink = activeLink?.startsWith("http");
  const faviconUrl = activeLink
    ? activeLink.startsWith("/")
      ? "/favicon.ico"
      : `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(activeLink)}&sz=64`
    : null;

  return (
    <main
      className={styles.mobileExperience}
      style={
        {
          "--artist-accent":
            selectedMember?.color || artist.color || "var(--color-brand-pink)",
        } as CSSProperties
      }
    >
      <header className={styles.mobileSceneHeader}>
        <div className={styles.mobileArtistIdentity}>
          {artist.logo_url && (
            <Image
              src={artist.logo_url}
              alt={`${artistName} logo`}
              width={120}
              height={40}
            />
          )}
          <h1>{artistName}</h1>
        </div>
        <div className={styles.mobileHeaderActions}>
          {activeLink && (
            <a
              href={activeLink}
              className={styles.mobileSceneLinkButton}
              aria-label={copy.openLink}
              title={copy.openLink}
              target={isExternalLink ? "_blank" : undefined}
              rel={isExternalLink ? "noreferrer" : undefined}
            >
              {faviconUrl ? (
                <span
                  className={styles.mobileSceneLinkFavicon}
                  style={{
                    backgroundImage: `url(${JSON.stringify(faviconUrl)})`,
                  }}
                  aria-hidden="true"
                />
              ) : (
                <ExternalLink aria-hidden="true" />
              )}
            </a>
          )}
          <Link
            href={`/${artist.slug}/discography`}
            className={styles.mobileHeaderDiscography}
            aria-label={copy.discography}
          >
            <Disc3 aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section
        className={styles.mobileSceneStage}
        aria-label={`${artistName} ${copy.scene}`}
      >
        <MobileSceneRail
          artistName={artistName}
          scenes={scenes}
          members={members}
          activeSceneId={activeSceneId}
          selectedMember={selectedMember}
          locale={locale}
          copy={copy}
          onChangeScene={onChangeScene}
          onSelectMember={onSelectMember}
        />
      </section>

      <MobileSceneControls
        scenes={scenes}
        activeIndex={activeIndex}
        activeMembers={activeMembers}
        selectedMember={selectedMember}
        memberBio={memberBio}
        groupBio={groupBio}
        copy={copy}
        onChangeScene={onChangeScene}
        onSelectMember={onSelectMember}
        onCloseMember={onCloseMember}
        onNavigateMember={onNavigateMember}
      />
    </main>
  );
}
