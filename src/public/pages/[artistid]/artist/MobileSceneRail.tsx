import Image from "next/image";
import { useEffect, useRef } from "react";
import { localizeText } from "@/core/i18n/localized";
import {
  outlineCentroid,
  outlineToPath,
  type ArtistScene,
} from "@/core/utils/artist-scenes";
import type { Locale } from "@/core/i18n/translations";
import type { Member, SceneCopy } from "./artist-scene-types";
import { getEnglishFirstMemberName } from "./artist-scene-types";
import styles from "@/styles/(public)/pages/artist-scene.module.css";

type Props = {
  artistName: string;
  scenes: ArtistScene[];
  members: Member[];
  activeSceneId: string;
  selectedMember: Member | null;
  locale: Locale;
  copy: SceneCopy;
  onChangeScene: (id: string) => void;
  onSelectMember: (id: string) => void;
};

export default function MobileSceneRail({
  artistName,
  scenes,
  members,
  activeSceneId,
  selectedMember,
  locale,
  copy,
  onChangeScene,
  onSelectMember,
}: Props) {
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rail = railRef.current;
    const activeSlide = rail?.querySelector<HTMLElement>(
      `[data-scene-id="${activeSceneId}"]`,
    );
    if (!rail || !activeSlide) return;
    if (
      Math.abs(activeSlide.offsetLeft - rail.scrollLeft) >
      rail.clientWidth * 0.55
    ) {
      activeSlide.scrollIntoView({
        behavior: "smooth",
        inline: "start",
        block: "nearest",
      });
    }
  }, [activeSceneId]);

  const syncSceneFromScroll = () => {
    const rail = railRef.current;
    if (!rail || rail.clientWidth === 0) return;
    const index = Math.max(
      0,
      Math.min(
        scenes.length - 1,
        Math.round(rail.scrollLeft / rail.clientWidth),
      ),
    );
    const next = scenes[index];
    if (next && next.id !== activeSceneId) onChangeScene(next.id);
  };

  return (
    <div
      ref={railRef}
      className={styles.mobileSceneRail}
      onScroll={syncSceneFromScroll}
    >
      {scenes.map((scene) => {
        const sceneTitle = localizeText(
          { ko: scene.title_ko, en: scene.title_en, ja: scene.title_ja },
          locale,
          scene.title,
        );
        const activeRegion = selectedMember
          ? scene.artist_scene_members.find(
              (region) => region.member_id === selectedMember.id,
            )
          : null;
        const activePath = activeRegion
          ? outlineToPath(activeRegion.outline)
          : null;
        const centroid = activeRegion
          ? outlineCentroid(activeRegion.outline)
          : { x: 50, y: 50 };
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
          <article
            key={scene.id}
            data-scene-id={scene.id}
            className={styles.mobileSceneSlide}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                position: "relative",
                ...transformStyle,
              }}
            >
              <Image
                src={scene.image_url}
                alt={`${artistName} ${sceneTitle || copy.scene}`}
                fill
                priority={scene.id === scenes[0]?.id}
                draggable={false}
                style={{
                  objectFit: "cover",
                  ...(selectedMember
                    ? {
                        filter: "grayscale(1) brightness(0.28) contrast(1.15)",
                      }
                    : {}),
                }}
              />
              {selectedMember && activeRegion && activePath && (
                <svg
                  className={styles.focusExposure}
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  style={{ pointerEvents: "none", zIndex: 2 }}
                >
                  <defs>
                    <filter
                      id={`mobile-feather-${activeRegion.id}`}
                      x="-25%"
                      y="-25%"
                      width="150%"
                      height="150%"
                    >
                      <feGaussianBlur stdDeviation="2.4" />
                    </filter>
                    <mask
                      id={`mobile-mask-${activeRegion.id}`}
                      maskUnits="userSpaceOnUse"
                      x="0"
                      y="0"
                      width="100"
                      height="100"
                      className={styles.alphaMask}
                    >
                      {activeRegion.mask_url ? (
                        <image
                          href={activeRegion.mask_url}
                          x="0"
                          y="0"
                          width="100"
                          height="100"
                          preserveAspectRatio="none"
                          filter={`url(#mobile-feather-${activeRegion.id})`}
                        />
                      ) : (
                        <path
                          d={activePath}
                          fill="var(--color-static-white)"
                          filter={`url(#mobile-feather-${activeRegion.id})`}
                        />
                      )}
                    </mask>
                  </defs>
                  <image
                    href={scene.image_url}
                    x="0"
                    y="0"
                    width="100"
                    height="100"
                    preserveAspectRatio="none"
                    mask={`url(#mobile-mask-${activeRegion.id})`}
                  />
                </svg>
              )}
            </div>
            <div className={styles.mobileSceneShade} aria-hidden="true" />
            <svg
              className={styles.mobileHitMap}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-label={copy.select}
              style={{ zIndex: 3 }}
            >
              {scene.artist_scene_members.map((region) => {
                const member = members.find(
                  (item) => item.id === region.member_id,
                );
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
                      if (event.key === "Enter" || event.key === " ")
                        onSelectMember(member.id);
                    }}
                  />
                );
              })}
            </svg>
          </article>
        );
      })}
    </div>
  );
}
