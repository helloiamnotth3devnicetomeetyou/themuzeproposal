"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { LuArrowLeft, LuArrowRight, LuDisc3, LuExternalLink, LuX } from "react-icons/lu";
import { localizeText } from "@/core/i18n/localized";
import { normalizeSceneLink, outlineToPath, outlineCentroid, type ArtistScene } from "@/core/utils/artist-scenes";
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
    const tagged = members.filter((member) => activeScene?.artist_scene_members?.some((region) => region.member_id === member.id));
    return tagged.length ? tagged : members;
  }, [activeScene, members]);
  const activeLink = normalizeSceneLink(activeScene?.link_url);
  const isExternalLink = activeLink?.startsWith("http");
  const faviconUrl = activeLink
    ? activeLink.startsWith("/")
      ? "/favicon.ico"
      : `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(activeLink)}&sz=64`
    : null;

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
                <span className={styles.mobileSceneLinkFavicon} style={{ backgroundImage: `url(${JSON.stringify(faviconUrl)})` }} aria-hidden="true" />
              ) : (
                <LuExternalLink aria-hidden="true" />
              )}
            </a>
          )}
          <Link href={`/${artist.slug}/discography`} className={styles.mobileHeaderDiscography} aria-label={copy.discography}>
            <LuDisc3 aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className={styles.mobileSceneStage} aria-label={`${artistName} ${copy.scene}`}>
        {!selectedMember && <div className={styles.clickHint}>{copy.clickHint}</div>}
        <div ref={railRef} className={styles.mobileSceneRail} onScroll={syncSceneFromScroll}>
          {scenes.map((scene) => {
            const sceneTitle = localizeText(
              { ko: scene.title_ko, en: scene.title_en, ja: scene.title_ja },
              locale,
              scene.title,
            );
            
            // Find if there is a highlighted member region in the current scene
            const activeRegion = selectedMember
              ? scene.artist_scene_members.find((r) => r.member_id === selectedMember.id)
              : null;
            const activePath = activeRegion ? outlineToPath(activeRegion.outline) : null;
            const centroid = activeRegion ? outlineCentroid(activeRegion.outline) : { x: 50, y: 50 };

            // Calculate translation for mobile zoom
            // Since mobile width is narrow, a translation factor of 0.35x works well to center the member.
            const transformStyle = selectedMember && activeRegion
              ? {
                  transform: `translate(${(50 - centroid.x) * 0.35}%, ${(50 - centroid.y) * 0.2}%) scale(1.22)`,
                  transformOrigin: "50% 50%",
                  transition: "transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)",
                }
              : {
                  transform: "translate(0, 0) scale(1)",
                  transformOrigin: "50% 50%",
                  transition: "transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)",
                };

            return (
              <article key={scene.id} data-scene-id={scene.id} className={styles.mobileSceneSlide}>
                <div style={{ width: "100%", height: "100%", position: "relative", ...transformStyle }}>
                  <Image
                    src={scene.image_url}
                    alt={`${artistName} ${sceneTitle || copy.scene}`}
                    fill
                    priority={scene.id === scenes[0]?.id}
                    draggable={false}
                    // Grayscale background when a member is selected
                    style={selectedMember ? { filter: "grayscale(1) brightness(0.28) contrast(1.15)" } : undefined}
                  />
                  
                  {/* Highlight Overlay (unaffected by grayscale filter) */}
                  {selectedMember && activeRegion && activePath && (
                    <svg className={styles.focusExposure} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style={{ pointerEvents: "none", zIndex: 2 }}>
                      <defs>
                        <filter id={`mobile-feather-${activeRegion.id}`} x="-25%" y="-25%" width="150%" height="150%">
                          <feGaussianBlur stdDeviation="2.4" />
                        </filter>
                        <mask id={`mobile-mask-${activeRegion.id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100" className={styles.alphaMask}>
                          {activeRegion.mask_url ? (
                            <image href={activeRegion.mask_url} x="0" y="0" width="100" height="100" preserveAspectRatio="none" filter={`url(#mobile-feather-${activeRegion.id})`} />
                          ) : (
                            <path d={activePath} fill="var(--color-static-white)" filter={`url(#mobile-feather-${activeRegion.id})`} />
                          )}
                        </mask>
                      </defs>
                      <image href={scene.image_url} x="0" y="0" width="100" height="100" preserveAspectRatio="none" mask={`url(#mobile-mask-${activeRegion.id})`} />
                    </svg>
                  )}
                </div>

                <div className={styles.mobileSceneShade} aria-hidden="true" />
                <svg className={styles.mobileHitMap} viewBox="0 0 100 100" preserveAspectRatio="none" aria-label={copy.select} style={{ zIndex: 3 }}>
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
                  <strong>{sceneTitle || copy.scene}</strong>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Control / Info panel underneath the 16:9 stage */}
      <section className={styles.mobileSceneControls} aria-label={copy.select}>
        {selectedMember ? (
          /* Member Info Display (Revealed Inline) */
          <div className={styles.mobileInlineMemberPanel}>
            <div className={styles.mobileInlineMemberHeader}>
              <div>
                <h2>{getEnglishFirstMemberName(selectedMember)}</h2>
                {selectedMember.name !== getEnglishFirstMemberName(selectedMember) && <p>{selectedMember.name}</p>}
              </div>
              <button type="button" className={styles.mobileInlineClose} onClick={onCloseMember} aria-label={copy.close}>
                <LuX aria-hidden="true" />
              </button>
            </div>
            {memberBio && <p className={styles.mobileInlineMemberBio}>{memberBio}</p>}
            <div className={styles.mobileInlineSheetNavigation}>
              <button type="button" onClick={() => onNavigateMember(-1)}>
                <LuArrowLeft aria-hidden="true" />
                {copy.previous}
              </button>
              <button type="button" onClick={() => onNavigateMember(1)}>
                {copy.next}
                <LuArrowRight aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : (
          /* Default General Controls (Counter, Members, Actions) */
          <>
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
                  className={(selectedMember as Member | null)?.id === member.id ? styles.mobileMemberChipActive : ""}
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
          </>
        )}
      </section>
    </main>
  );
}
