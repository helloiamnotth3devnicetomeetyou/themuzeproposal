"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { LuArrowLeft, LuArrowRight, LuDisc3, LuExternalLink, LuX } from "react-icons/lu";
import { localizeText } from "@/core/i18n/localized";
import { normalizeSceneLink, outlineToPath, type ArtistScene } from "@/core/utils/artist-scenes";
import type { Locale } from "@/core/i18n/translations";
import type { Artist, Member, SceneCopy } from "./artist-scene-types";
import { getEnglishFirstMemberName } from "./artist-scene-types";
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
  const railRef = useRef<HTMLDivElement>(null);
  const activeScene = scenes.find((scene) => scene.id === activeSceneId) ?? scenes[0];
  const activeIndex = Math.max(0, scenes.findIndex((scene) => scene.id === activeScene?.id));
  const activeMembers = useMemo(() => {
    const tagged = members.filter((member) => activeScene?.artist_scene_members.some((region) => region.member_id === member.id));
    return tagged.length ? tagged : members;
  }, [activeScene, members]);
  const memberScenes = selectedMember
    ? scenes.filter((scene) => scene.artist_scene_members.some((region) => region.member_id === selectedMember.id))
    : [];
  const activeLink = normalizeSceneLink(activeScene?.link_url);

  useEffect(() => {
    const rail = railRef.current;
    const activeSlide = rail?.querySelector<HTMLElement>(`[data-scene-id="${activeSceneId}"]`);
    if (!rail || !activeSlide) return;
    if (Math.abs(activeSlide.offsetLeft - rail.scrollLeft) > rail.clientWidth * .55) {
      activeSlide.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    }
  }, [activeSceneId]);

  const syncSceneFromScroll = () => {
    const rail = railRef.current;
    if (!rail || rail.clientWidth === 0) return;
    const index = Math.max(0, Math.min(scenes.length - 1, Math.round(rail.scrollLeft / rail.clientWidth)));
    const next = scenes[index];
    if (next && next.id !== activeSceneId) onChangeScene(next.id);
  };

  return (
    <main
      className={styles.mobileExperience}
      style={{ "--artist-accent": selectedMember?.color || artist.color || "var(--color-brand-pink)" } as CSSProperties}
    >
      <header className={styles.mobileSceneHeader}>
        <div>
          <span>ARTIST SCENE</span>
          <h1>{artistName}</h1>
        </div>
        <Link href={`/${artist.slug}/discography`} aria-label={copy.discography}>
          <LuDisc3 aria-hidden="true" />
        </Link>
      </header>

      <section className={styles.mobileSceneStage} aria-label={`${artistName} ${copy.scene}`}>
        <div ref={railRef} className={styles.mobileSceneRail} onScroll={syncSceneFromScroll}>
          {scenes.map((scene) => {
            const sceneTitle = localizeText(
              { ko: scene.title_ko, en: scene.title_en, ja: scene.title_ja },
              locale,
              scene.title,
            );
            return (
              <article key={scene.id} data-scene-id={scene.id} className={styles.mobileSceneSlide}>
                <Image
                  src={scene.image_url}
                  alt={`${artistName} ${sceneTitle || copy.scene}`}
                  fill
                  priority={scene.id === scenes[0]?.id}
                  unoptimized
                  draggable={false}
                />
                <div className={styles.mobileSceneShade} aria-hidden="true" />
                <svg className={styles.mobileHitMap} viewBox="0 0 100 100" preserveAspectRatio="none" aria-label={copy.select}>
                  {scene.artist_scene_members.map((region) => {
                    const member = members.find((item) => item.id === region.member_id);
                    const path = outlineToPath(region.outline);
                    if (!member || !path) return null;
                    return (
                      <path
                        key={region.id}
                        d={path}
                        tabIndex={0}
                        role="button"
                        aria-label={getEnglishFirstMemberName(member)}
                        onClick={() => onSelectMember(member.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") onSelectMember(member.id);
                        }}
                      />
                    );
                  })}
                </svg>
                <div className={styles.mobileSceneCaption}>
                  <span>{String(scenes.indexOf(scene) + 1).padStart(2, "0")}</span>
                  <strong>{sceneTitle || copy.scene}</strong>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.mobileSceneControls} aria-label={copy.select}>
        <div className={styles.mobileFilmCounter}>
          <span>{String(activeIndex + 1).padStart(2, "0")}</span>
          <div><i style={{ width: `${((activeIndex + 1) / Math.max(1, scenes.length)) * 100}%` }} /></div>
          <span>{String(scenes.length).padStart(2, "0")}</span>
        </div>
        <div className={styles.mobileMemberChips}>
          {activeMembers.map((member) => (
            <button
              key={member.id}
              type="button"
              className={selectedMember?.id === member.id ? styles.mobileMemberChipActive : ""}
              onClick={() => onSelectMember(member.id)}
            >
              {member.image_url && <Image src={member.image_url} alt="" width={32} height={32} />}
              <span>{getEnglishFirstMemberName(member)}</span>
            </button>
          ))}
        </div>
        <div className={styles.mobileSceneActions}>
          <button
            type="button"
            disabled={activeIndex === 0}
            onClick={() => onChangeScene(scenes[Math.max(0, activeIndex - 1)].id)}
            aria-label={copy.previous}
          >
            <LuArrowLeft aria-hidden="true" />
          </button>
          {groupBio && <p>{groupBio}</p>}
          <button
            type="button"
            disabled={activeIndex === scenes.length - 1}
            onClick={() => onChangeScene(scenes[Math.min(scenes.length - 1, activeIndex + 1)].id)}
            aria-label={copy.next}
          >
            <LuArrowRight aria-hidden="true" />
          </button>
        </div>
        {activeLink && (
          <a
            href={activeLink}
            className={styles.mobileExternalLink}
            target={activeLink.startsWith("http") ? "_blank" : undefined}
            rel={activeLink.startsWith("http") ? "noreferrer" : undefined}
          >
            <LuExternalLink aria-hidden="true" />
            {copy.openLink}
          </a>
        )}
      </section>

      {selectedMember && (
        <div className={styles.mobileSheetLayer}>
          <button type="button" className={styles.mobileSheetBackdrop} aria-label={copy.close} onClick={onCloseMember} />
          <aside className={styles.mobileMemberSheet} role="dialog" aria-modal="true" aria-label={getEnglishFirstMemberName(selectedMember)}>
            <div className={styles.mobileSheetHandle} aria-hidden="true" />
            <button type="button" className={styles.mobileSheetClose} onClick={onCloseMember} aria-label={copy.close}>
              <LuX aria-hidden="true" />
            </button>
            <div className={styles.mobileMemberIdentity}>
              {selectedMember.image_url && (
                <div>
                  <Image src={selectedMember.image_url} alt="" fill sizes="96px" />
                </div>
              )}
              <header>
                <span>MEMBER PROFILE</span>
                <h2>{getEnglishFirstMemberName(selectedMember)}</h2>
                {selectedMember.name !== getEnglishFirstMemberName(selectedMember) && <p>{selectedMember.name}</p>}
              </header>
            </div>
            {memberBio && <p className={styles.mobileMemberBio}>{memberBio}</p>}
            {memberScenes.length > 0 && (
              <div className={styles.mobileMemberScenes} aria-label={`${getEnglishFirstMemberName(selectedMember)} ${copy.scene}`}>
                {memberScenes.map((scene) => (
                  <button
                    key={scene.id}
                    type="button"
                    className={scene.id === activeSceneId ? styles.mobileMemberSceneActive : ""}
                    onClick={() => onChangeScene(scene.id)}
                  >
                    <Image src={scene.image_url} alt="" fill sizes="112px" />
                  </button>
                ))}
              </div>
            )}
            <div className={styles.mobileSheetNavigation}>
              <button type="button" onClick={() => onNavigateMember(-1)}>
                <LuArrowLeft aria-hidden="true" />
                {copy.previous}
              </button>
              <button type="button" onClick={() => onNavigateMember(1)}>
                {copy.next}
                <LuArrowRight aria-hidden="true" />
              </button>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
