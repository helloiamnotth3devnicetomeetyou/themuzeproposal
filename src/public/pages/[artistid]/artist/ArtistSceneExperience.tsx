"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { localizeText } from "@/core/i18n/localized";
import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";
import { preloadImages, scheduleImagePreload } from "@/core/utils/image-preload";
import { outlineCentroid } from "@/core/utils/artist-scenes";
import LoadingIndicator from "@/core/components/feedback/LoadingIndicator";
import { useLocale } from "@/core/providers/LocaleContext";
import { usePreviewPayload } from "@/core/preview/PreviewProvider";
import MemberDetailOverlay from "./MemberDetailOverlay";
import MobileArtistScene from "./MobileArtistScene";
import SceneCanvas from "./SceneCanvas";
import SceneDock from "./SceneDock";
import { useArtistSceneData } from "./useArtistSceneData";
import styles from "@/styles/(public)/pages/artist-scene.module.css";

import type { ArtistSceneData, Member } from "./artist-scene-types";
import type { ArtistScene } from "@/core/utils/artist-scenes";

const EMPTY_MEMBERS: Member[] = [];
const EMPTY_SCENES: ArtistScene[] = [];

export default function ArtistSceneExperience({ artistSlug, initialMemberSlug, initialData = null }: { artistSlug: string; initialMemberSlug?: string; initialData?: ArtistSceneData | null }) {
  const { locale, t } = useLocale();
  const copy = t.artistScene;
  const profilePreview = usePreviewPayload("artist-profile");
  const memberPreview = usePreviewPayload("artist-member");
  const { data, loading, error } = useArtistSceneData({ artistSlug, profilePreview, memberPreview, initialData });
  const [activeSceneId, setActiveSceneId] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [groupFocused, setGroupFocused] = useState(false);
  const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);
  const [isMobileExperience, setIsMobileExperience] = useState(false);
  const focusWasOpenedHere = useRef(false);

  const artist = data?.artist;
  const members = data?.members ?? EMPTY_MEMBERS;
  const scenes = data?.scenes ?? EMPTY_SCENES;
  const activeScene = scenes.find((scene) => scene.id === activeSceneId) ?? scenes[0];
  const selectedMember = members.find((member) => member.id === selectedMemberId) ?? null;
  const focusMemberId = hoveredMemberId || selectedMemberId;
  const selectedRegion = activeScene?.artist_scene_members.find((region) => region.member_id === selectedMemberId);

  const artistName = artist ? localizeText({ ko: artist.name_ko ?? artist.name, en: artist.name_en ?? artist.eng_name, ja: artist.name_ja }, locale, artist.name) : artistSlug.toUpperCase();
  const scenePreloadCandidates = useMemo(() => {
    const urls = [
      ...scenes.slice(1).map((scene) => scene.image_url),
      ...scenes.flatMap((scene) => scene.artist_scene_members.map((region) => region.mask_url).filter(Boolean)),
    ] as string[];
    return Array.from(new Set(urls)).map((src) => ({ src }));
  }, [scenes]);

  useEffect(() => { if (scenes.length) void Promise.resolve().then(() => setActiveSceneId((current) => scenes.some((scene) => scene.id === current) ? current : scenes[0].id)); }, [scenes]);
  useEffect(() => {
    void preloadImages(scenePreloadCandidates.slice(0, 1));
    return scheduleImagePreload(scenePreloadCandidates.slice(1), { concurrency: 2 });
  }, [scenePreloadCandidates]);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobileExperience(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => { if (initialMemberSlug) void Promise.resolve().then(() => setSelectedMemberId(members.find((member) => member.slug === initialMemberSlug)?.id ?? null)); }, [initialMemberSlug, members]);
  useEffect(() => { const sync = () => { const slug = window.location.pathname.match(/^\/[^/]+\/artist\/([^/]+)\/?$/)?.[1]; setSelectedMemberId(slug ? members.find((member) => member.slug === decodeURIComponent(slug))?.id ?? null : null); setGroupFocused(false); setHoveredMemberId(null); focusWasOpenedHere.current = false; }; window.addEventListener("popstate", sync); return () => window.removeEventListener("popstate", sync); }, [members]);

  const memberScenes = useMemo(() => selectedMemberId ? scenes.filter((scene) => scene.artist_scene_members.some((region) => region.member_id === selectedMemberId)) : scenes, [scenes, selectedMemberId]);
  const activeSceneMembers = useMemo(() => members.filter((member) => activeScene?.artist_scene_members.some((region) => region.member_id === member.id)), [activeScene, members]);
  const requestSceneChange = (id: string) => {
    setHoveredMemberId(null);
    if (id === activeScene?.id) return;
    setActiveSceneId(id);
  };
  const selectMember = (memberId: string) => { const member = members.find((item) => item.id === memberId); if (!member || !artist) return; const matchingScene = activeScene?.artist_scene_members.some((region) => region.member_id === memberId) ? activeScene : scenes.find((scene) => scene.artist_scene_members.some((region) => region.member_id === memberId)); if (matchingScene) setActiveSceneId(matchingScene.id); const path = `/${artist.slug}/artist/${member.slug}`; if (!selectedMemberId) { window.history.pushState({ artistMemberFocus: true }, "", path); focusWasOpenedHere.current = true; } else window.history.replaceState({ artistMemberFocus: true }, "", path); setSelectedMemberId(memberId); setGroupFocused(false); setHoveredMemberId(null); };
  const closeMember = () => { if (!artist) return; if (focusWasOpenedHere.current) { focusWasOpenedHere.current = false; window.history.back(); return; } window.history.replaceState(null, "", `/${artist.slug}/artist`); setSelectedMemberId(null); setGroupFocused(false); setHoveredMemberId(null); };
  const reset = () => { if (!artist) return; focusWasOpenedHere.current = false; window.history.replaceState(null, "", `/${artist.slug}/artist`); setSelectedMemberId(null); setGroupFocused(false); setHoveredMemberId(null); setActiveSceneId(scenes[0]?.id ?? ""); };
  const navigate = (direction: -1 | 1) => { const index = activeSceneMembers.findIndex((member) => member.id === selectedMemberId); if (index >= 0 && activeSceneMembers.length > 1) selectMember(activeSceneMembers[(index + direction + activeSceneMembers.length) % activeSceneMembers.length].id); };
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape" && (selectedMemberId || groupFocused)) closeMember(); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); });

  if (loading) return <main className={styles.statePage}><LoadingIndicator label={copy.loading} /></main>;
  if (!artist || !activeScene) return <main className={styles.statePage}><b>404</b><span>{error || copy.notFound}</span><Link href="/artists">{copy.back}</Link></main>;
  const groupBio = localizeText({ ko: artist.description_ko, en: artist.description_en, ja: artist.description_ja }, locale);
  const memberBio = selectedMember && localizeText({ ko: selectedMember.bio_ko ?? selectedMember.role_ko, en: selectedMember.bio_en ?? selectedMember.role_en, ja: selectedMember.bio_ja ?? selectedMember.role_ja }, locale);
  const localizedScene = { ...activeScene, title: localizeText({ ko: activeScene.title_ko, en: activeScene.title_en, ja: activeScene.title_ja }, locale, activeScene.title) };
  const centroid = selectedRegion ? outlineCentroid(selectedRegion.outline) : { x: 50, y: 50 };
  if (isMobileExperience) return <MobileArtistScene
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
    onChangeScene={(id) => {
      setActiveSceneId(id);
    }}
    onSelectMember={selectMember}
    onCloseMember={closeMember}
    onNavigateMember={navigate}
  />;
  return <main className={`${styles.experience} ${selectedMember || groupFocused ? styles.hasSelection : ""}`} style={{ "--artist-accent": selectedMember?.color || artist.color || BRAND_PINK_HEX } as CSSProperties}>
    {!selectedMember && !groupFocused && <div className={styles.clickHint}>{copy.clickHint}</div>}
    <SceneCanvas scene={localizedScene} members={members} artistName={artistName} sceneLabel={copy.scene} focusMemberId={focusMemberId} groupFocused={groupFocused} selectedMember={Boolean(selectedMember)} cameraOffset={{ x: (50 - centroid.x) * .14, y: (50 - centroid.y) * .1 }} onClose={() => { if (selectedMember || groupFocused) closeMember(); }} onHover={setHoveredMemberId} onSelect={selectMember} />
    {!selectedMember && <div className={`${styles.artistIdentity} ${groupFocused ? styles.artistIdentityFocused : ""}`}><button type="button" className={styles.artistWordmark} onClick={(event) => { event.stopPropagation(); setHoveredMemberId(null); setSelectedMemberId(null); setGroupFocused((current) => !current); }} aria-label={`${artistName} ${copy.profile}`} aria-expanded={groupFocused} aria-controls={groupBio ? "group-artist-bio" : undefined}>{artist.logo_url && <Image src={artist.logo_url} alt={`${artistName} logo`} width={240} height={80} /> }<h1>{artistName}</h1></button>{groupBio && <div id="group-artist-bio" className={styles.artistBioReveal} aria-hidden={!groupFocused}><p>{groupBio}</p></div>}</div>}
    <MemberDetailOverlay member={selectedMember} memberBio={memberBio || ""} panelLeft={Boolean(selectedRegion && outlineCentroid(selectedRegion.outline).x > 56)} copy={copy} onClose={closeMember} onNavigate={navigate} />
    <SceneDock artist={artist} member={selectedMember} scenes={memberScenes} activeSceneId={activeScene.id} copy={copy} showReset={Boolean(selectedMember || groupFocused || activeScene.id !== scenes[0]?.id)} onChangeScene={requestSceneChange} onReset={reset} />
    <div className={styles.scenePreloader} aria-hidden="true">
      {scenes.map((scene, index) => (
        <Image
          key={scene.id}
          src={scene.image_url}
          alt=""
          width={scene.image_width || 1600}
          height={scene.image_height || 900}
          fetchPriority={index === 0 ? "high" : undefined}
          loading={index === 0 ? undefined : "lazy"}
        />
      ))}
    </div>
    <div className={styles.sceneSweep} key={`sweep-${activeScene.id}`} aria-hidden="true" />
  </main>;
}
