"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import dynamic from "next/dynamic";
import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { localizeText } from "@/core/i18n/localized";
import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";
import { preloadImages } from "@/core/utils/image-preload";
import { outlineCentroid } from "@/core/utils/artist-scenes";
import { sanitizeRichText } from "@/core/utils/rich-text";
import LoadingIndicator from "@/core/components/feedback/LoadingIndicator";
import { useLocale } from "@/core/providers/LocaleContext";
import { usePreviewPayload } from "@/core/preview/PreviewProvider";
import SceneCanvas from "./SceneCanvas";
import SceneDock from "./SceneDock";
import { useArtistSceneData } from "./useArtistSceneData";
import styles from "@/styles/(public)/pages/artist-scene.module.css";

import type { ArtistSceneData, Member } from "./artist-scene-types";
import type { ArtistScene } from "@/core/utils/artist-scenes";

const EMPTY_MEMBERS: Member[] = [];
const EMPTY_SCENES: ArtistScene[] = [];
const MemberDetailOverlay = dynamic(() => import("./MemberDetailOverlay"));
const MobileArtistScene = dynamic(() => import("./MobileArtistScene"));

function sceneImageCandidates(scene: ArtistScene) {
  const { props } = getImageProps({
    src: scene.image_url,
    alt: "",
    width: scene.image_width || 1600,
    height: scene.image_height || 900,
    sizes: "100vw",
  });
  return [{ src: props.src, srcSet: props.srcSet, sizes: props.sizes }];
}

export default function ArtistSceneExperience({
  artistSlug,
  initialMemberSlug,
  initialData = null,
}: {
  artistSlug: string;
  initialMemberSlug?: string;
  initialData?: ArtistSceneData | null;
}) {
  const { locale, t } = useLocale();
  const copy = t.artistScene;
  const profilePreview = usePreviewPayload("artist-profile");
  const memberPreview = usePreviewPayload("artist-member");
  const { data, loading, error, loadSceneMembers } = useArtistSceneData({
    artistSlug,
    profilePreview,
    memberPreview,
    initialData,
  });
  const [activeSceneId, setActiveSceneId] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [groupFocused, setGroupFocused] = useState(false);
  const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);
  const [isMobileExperience, setIsMobileExperience] = useState(false);
  const focusWasOpenedHere = useRef(false);
  const pendingSceneId = useRef<string | null>(null);

  const artist = data?.artist;
  const members = data?.members ?? EMPTY_MEMBERS;
  const scenes = data?.scenes ?? EMPTY_SCENES;
  const activeScene =
    scenes.find((scene) => scene.id === activeSceneId) ?? scenes[0];
  const selectedMember =
    members.find((member) => member.id === selectedMemberId) ?? null;
  const focusMemberId = hoveredMemberId || selectedMemberId;
  const selectedRegion = activeScene?.artist_scene_members.find(
    (region) => region.member_id === selectedMemberId,
  );
  const selectedRegionCentroid = useMemo(
    () =>
      selectedRegion
        ? outlineCentroid(selectedRegion.outline)
        : { x: 50, y: 50 },
    [selectedRegion],
  );

  const artistName = artist
    ? localizeText(
        {
          ko: artist.name_ko ?? artist.name,
          en: artist.name_en ?? artist.eng_name,
          ja: artist.name_ja,
        },
        locale,
        artist.name,
      )
    : artistSlug.toUpperCase();
  const scenePreloadCandidates = useMemo(() => {
    if (!activeScene || scenes.length <= 1) return [];
    const activeIndex = scenes.findIndex(
      (scene) => scene.id === activeScene.id,
    );
    const adjacentIndexes = new Set([
      (activeIndex - 1 + scenes.length) % scenes.length,
      (activeIndex + 1) % scenes.length,
    ]);
    return Array.from(adjacentIndexes).flatMap((index) =>
      sceneImageCandidates(scenes[index]),
    );
  }, [activeScene, scenes]);

  useEffect(() => {
    if (scenes.length)
      void Promise.resolve().then(() =>
        setActiveSceneId((current) =>
          scenes.some((scene) => scene.id === current) ? current : scenes[0].id,
        ),
      );
  }, [scenes]);
  useEffect(() => {
    if (activeScene) void loadSceneMembers(activeScene.id);
  }, [activeScene, loadSceneMembers]);
  useEffect(() => {
    void preloadImages(scenePreloadCandidates, { concurrency: 2 });
  }, [scenePreloadCandidates]);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobileExperience(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (initialMemberSlug)
      void Promise.resolve().then(() =>
        setSelectedMemberId(
          members.find((member) => member.slug === initialMemberSlug)?.id ??
            null,
        ),
      );
  }, [initialMemberSlug, members]);
  useEffect(() => {
    const sync = () => {
      const slug = window.location.pathname.match(
        /^\/[^/]+\/artist\/([^/]+)\/?$/,
      )?.[1];
      setSelectedMemberId(
        slug
          ? (members.find((member) => member.slug === decodeURIComponent(slug))
              ?.id ?? null)
          : null,
      );
      setGroupFocused(false);
      setHoveredMemberId(null);
      focusWasOpenedHere.current = false;
    };
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [members]);

  const memberScenes = useMemo(
    () =>
      selectedMemberId
        ? scenes.filter(
            (scene) =>
              scene.member_ids?.includes(selectedMemberId) ||
              scene.artist_scene_members.some(
                (region) => region.member_id === selectedMemberId,
              ),
          )
        : scenes,
    [scenes, selectedMemberId],
  );
  const activeSceneMembers = useMemo(
    () =>
      members.filter((member) =>
        activeScene?.artist_scene_members.some(
          (region) => region.member_id === member.id,
        ),
      ),
    [activeScene, members],
  );
  const requestSceneChange = async (id: string) => {
    setHoveredMemberId(null);
    if (id === activeScene?.id) {
      pendingSceneId.current = null;
      return;
    }
    if (pendingSceneId.current === id) return;
    const scene = scenes.find((item) => item.id === id);
    if (!scene) return;
    pendingSceneId.current = id;
    await preloadImages(sceneImageCandidates(scene), { concurrency: 2 });
    if (pendingSceneId.current !== id) return;
    pendingSceneId.current = null;
    setActiveSceneId(id);
  };
  const selectMember = (memberId: string) => {
    const member = members.find((item) => item.id === memberId);
    if (!member || !artist) return;
    const matchingScene = activeScene?.member_ids?.includes(memberId)
      ? activeScene
      : scenes.find((scene) => scene.member_ids?.includes(memberId));
    if (matchingScene) setActiveSceneId(matchingScene.id);
    const path = `/${artist.slug}/artist/${member.slug}${window.location.search}`;
    if (!selectedMemberId) {
      window.history.pushState({ artistMemberFocus: true }, "", path);
      focusWasOpenedHere.current = true;
    } else window.history.replaceState({ artistMemberFocus: true }, "", path);
    setSelectedMemberId(memberId);
    setGroupFocused(false);
    setHoveredMemberId(null);
  };
  const closeMember = () => {
    if (!artist) return;
    if (focusWasOpenedHere.current) {
      focusWasOpenedHere.current = false;
      window.history.back();
      return;
    }
    window.history.replaceState(
      null,
      "",
      `/${artist.slug}/artist${window.location.search}`,
    );
    setSelectedMemberId(null);
    setGroupFocused(false);
    setHoveredMemberId(null);
  };
  const reset = () => {
    if (!artist) return;
    focusWasOpenedHere.current = false;
    pendingSceneId.current = null;
    window.history.replaceState(
      null,
      "",
      `/${artist.slug}/artist${window.location.search}`,
    );
    setSelectedMemberId(null);
    setGroupFocused(false);
    setHoveredMemberId(null);
    setActiveSceneId(scenes[0]?.id ?? "");
  };
  const navigate = (direction: -1 | 1) => {
    const index = activeSceneMembers.findIndex(
      (member) => member.id === selectedMemberId,
    );
    if (index >= 0 && activeSceneMembers.length > 1)
      selectMember(
        activeSceneMembers[
          (index + direction + activeSceneMembers.length) %
            activeSceneMembers.length
        ].id,
      );
  };
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && (selectedMemberId || groupFocused))
        closeMember();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  });

  if (loading)
    return (
      <main className={styles.statePage}>
        <LoadingIndicator label={copy.loading} />
      </main>
    );
  if (!artist || !activeScene)
    return (
      <main className={styles.statePage}>
        <b>404</b>
        <span>{error || copy.notFound}</span>
        <Link href="/artists">{copy.back}</Link>
      </main>
    );
  const groupBio = localizeText(
    {
      ko: artist.description_ko,
      en: artist.description_en,
      ja: artist.description_ja,
    },
    locale,
  );
  const memberBio =
    selectedMember &&
    localizeText(
      {
        ko: selectedMember.bio_ko ?? selectedMember.role_ko,
        en: selectedMember.bio_en ?? selectedMember.role_en,
        ja: selectedMember.bio_ja ?? selectedMember.role_ja,
      },
      locale,
    );
  const localizedScene = {
    ...activeScene,
    title: localizeText(
      {
        ko: activeScene.title_ko,
        en: activeScene.title_en,
        ja: activeScene.title_ja,
      },
      locale,
      activeScene.title,
    ),
  };
  const centroid = selectedRegionCentroid;
  if (isMobileExperience)
    return (
      <MobileArtistScene
        artist={artist}
        artistName={artistName}
        groupBio={groupBio}
        members={members}
        scenes={scenes}
        activeSceneId={activeScene.id}
        selectedMember={selectedMember}
        memberBio={memberBio || ""}
        locale={locale}
        copy={copy}
        onChangeScene={requestSceneChange}
        onSelectMember={selectMember}
        onCloseMember={closeMember}
        onNavigateMember={navigate}
      />
    );
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
          x: (50 - centroid.x) * 0.14,
          y: (50 - centroid.y) * 0.1,
        }}
        onClose={() => {
          if (selectedMember || groupFocused) closeMember();
        }}
        onHover={setHoveredMemberId}
        onSelect={selectMember}
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
              setHoveredMemberId(null);
              setSelectedMemberId(null);
              setGroupFocused((current) => !current);
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
          memberBio={memberBio || ""}
          panelLeft={selectedRegionCentroid.x > 56}
          copy={copy}
          onClose={closeMember}
          onNavigate={navigate}
        />
      )}
      <SceneDock
        artist={artist}
        member={selectedMember}
        scenes={memberScenes}
        activeSceneId={activeScene.id}
        copy={copy}
        showReset={Boolean(
          selectedMember || groupFocused || activeScene.id !== scenes[0]?.id,
        )}
        onChangeScene={requestSceneChange}
        onReset={reset}
      />
      <div
        className={styles.sceneSweep}
        key={`sweep-${activeScene.id}`}
        aria-hidden="true"
      />
    </main>
  );
}
