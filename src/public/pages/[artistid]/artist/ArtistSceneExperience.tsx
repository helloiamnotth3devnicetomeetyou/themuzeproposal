"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";
import { outlineCentroid } from "@/core/utils/artist-scenes";
import LoadingIndicator from "@/core/components/feedback/LoadingIndicator";
import { useLocale } from "@/core/providers/LocaleContext";
import { usePreviewPayload } from "@/core/preview/PreviewProvider";
import MemberDetailOverlay from "./MemberDetailOverlay";
import SceneCanvas from "./SceneCanvas";
import SceneDock from "./SceneDock";
import { useArtistSceneData } from "./useArtistSceneData";
import type { SceneCopy } from "./artist-scene-types";
import styles from "@/styles/(public)/pages/artist-scene.module.css";

type Dimensions = Record<string, { width: number; height: number }>;
const copy: SceneCopy = { select: "Select a member", scene: "Concept scenes", close: "Close profile", previous: "Previous member", next: "Next member", discography: "Discography", profile: "Profile", groupProfile: "Artist profile", expand: "Show introduction", collapse: "Hide introduction" };
const EMPTY_MEMBERS: never[] = [];
const EMPTY_SCENES: never[] = [];

export default function ArtistSceneExperience({ artistSlug, initialMemberSlug }: { artistSlug: string; initialMemberSlug?: string }) {
  const { locale } = useLocale();
  const profilePreview = usePreviewPayload("artist-profile");
  const memberPreview = usePreviewPayload("artist-member");
  const { data, loading, error } = useArtistSceneData({ artistSlug, profilePreview, memberPreview });
  const [activeSceneId, setActiveSceneId] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [groupFocused, setGroupFocused] = useState(false);
  const [groupBioExpanded, setGroupBioExpanded] = useState(false);
  const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<Dimensions>({});
  const [frameSize, setFrameSize] = useState<{ width: number; height: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const focusWasOpenedHere = useRef(false);

  const artist = data?.artist;
  const members = data?.members ?? EMPTY_MEMBERS;
  const scenes = data?.scenes ?? EMPTY_SCENES;
  const activeScene = scenes.find((scene) => scene.id === activeSceneId) ?? scenes[0];
  const selectedMember = members.find((member) => member.id === selectedMemberId) ?? null;
  const focusMemberId = hoveredMemberId || selectedMemberId;
  const selectedRegion = activeScene?.artist_scene_members.find((region) => region.member_id === selectedMemberId);
  const artistName = artist?.eng_name || artist?.name || artistSlug.toUpperCase();
  const sceneRatio = activeScene ? ((dimensions[activeScene.id]?.width || activeScene.image_width || 16) / (dimensions[activeScene.id]?.height || activeScene.image_height || 9)) : 16 / 9;

  useEffect(() => { if (scenes.length) void Promise.resolve().then(() => setActiveSceneId((current) => scenes.some((scene) => scene.id === current) ? current : scenes[0].id)); }, [scenes]);
  useEffect(() => { if (initialMemberSlug) void Promise.resolve().then(() => setSelectedMemberId(members.find((member) => member.slug === initialMemberSlug)?.id ?? null)); }, [initialMemberSlug, members]);
  useEffect(() => { const stage = stageRef.current; if (!stage) return; const observer = new ResizeObserver(([entry]) => { const width = Math.max(entry.contentRect.width, entry.contentRect.height * sceneRatio); setFrameSize({ width, height: width / sceneRatio }); }); observer.observe(stage); return () => observer.disconnect(); }, [sceneRatio]);
  useEffect(() => { const sync = () => { const slug = window.location.pathname.match(/^\/[^/]+\/artist\/([^/]+)\/?$/)?.[1]; setSelectedMemberId(slug ? members.find((member) => member.slug === decodeURIComponent(slug))?.id ?? null : null); setGroupFocused(false); setGroupBioExpanded(false); setHoveredMemberId(null); focusWasOpenedHere.current = false; }; window.addEventListener("popstate", sync); return () => window.removeEventListener("popstate", sync); }, [members]);

  const memberScenes = useMemo(() => selectedMemberId ? scenes.filter((scene) => scene.artist_scene_members.some((region) => region.member_id === selectedMemberId)) : scenes, [scenes, selectedMemberId]);
  const activeSceneMembers = useMemo(() => members.filter((member) => activeScene?.artist_scene_members.some((region) => region.member_id === member.id)), [activeScene, members]);
  const selectMember = (memberId: string) => { const member = members.find((item) => item.id === memberId); if (!member || !artist) return; const matchingScene = activeScene?.artist_scene_members.some((region) => region.member_id === memberId) ? activeScene : scenes.find((scene) => scene.artist_scene_members.some((region) => region.member_id === memberId)); if (matchingScene) setActiveSceneId(matchingScene.id); const path = `/${artist.slug}/artist/${member.slug}`; if (!selectedMemberId) { window.history.pushState({ artistMemberFocus: true }, "", path); focusWasOpenedHere.current = true; } else window.history.replaceState({ artistMemberFocus: true }, "", path); setSelectedMemberId(memberId); setGroupFocused(false); setGroupBioExpanded(false); setHoveredMemberId(null); };
  const closeMember = () => { if (!artist) return; if (focusWasOpenedHere.current) { focusWasOpenedHere.current = false; window.history.back(); return; } window.history.replaceState(null, "", `/${artist.slug}/artist`); setSelectedMemberId(null); setGroupFocused(false); setGroupBioExpanded(false); setHoveredMemberId(null); };
  const reset = () => { if (!artist) return; focusWasOpenedHere.current = false; window.history.replaceState(null, "", `/${artist.slug}/artist`); setSelectedMemberId(null); setGroupFocused(false); setGroupBioExpanded(false); setHoveredMemberId(null); setActiveSceneId(scenes[0]?.id ?? ""); };
  const navigate = (direction: -1 | 1) => { const index = activeSceneMembers.findIndex((member) => member.id === selectedMemberId); if (index >= 0 && activeSceneMembers.length > 1) selectMember(activeSceneMembers[(index + direction + activeSceneMembers.length) % activeSceneMembers.length].id); };
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape" && (selectedMemberId || groupFocused)) closeMember(); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); });

  if (loading) return <main className={styles.statePage}><LoadingIndicator label="Loading artist scene" /></main>;
  if (!artist || !activeScene) return <main className={styles.statePage}><b>404</b><span>{error || "Artist scene not found."}</span><Link href="/artists">Back to artists</Link></main>;
  const groupBio = (locale === "ko" ? artist.description_ko : locale === "ja" ? artist.description_ja : artist.description_en) || artist.description_ko || artist.description_en || artist.description_ja || "";
  const memberBio = selectedMember && ((locale === "ko" ? selectedMember.bio_ko : locale === "ja" ? selectedMember.bio_ja : selectedMember.bio_en) || selectedMember.bio_ko || selectedMember.role_ko || "");
  const centroid = selectedRegion ? outlineCentroid(selectedRegion.outline) : { x: 50, y: 50 };
  return <main className={`${styles.experience} ${selectedMember || groupFocused ? styles.hasSelection : ""}`} style={{ "--artist-accent": selectedMember?.color || artist.color || BRAND_PINK_HEX } as CSSProperties}>
    <SceneCanvas scene={activeScene} members={members} artistName={artistName} sceneLabel={copy.scene} focusMemberId={focusMemberId} groupFocused={groupFocused} selectedMember={Boolean(selectedMember)} cameraOffset={{ x: (50 - centroid.x) * .14, y: (50 - centroid.y) * .1 }} frameSize={frameSize} stageRef={stageRef} onDimensions={(width, height) => setDimensions((current) => ({ ...current, [activeScene.id]: { width, height } }))} onClose={() => { if (selectedMember || groupFocused) closeMember(); }} onHover={setHoveredMemberId} onSelect={selectMember} />
    {!selectedMember && <div className={`${styles.artistIdentity} ${groupFocused ? styles.identityHidden : ""}`} aria-hidden={groupFocused}><button type="button" className={styles.artistWordmark} onClick={() => { setHoveredMemberId(null); setSelectedMemberId(null); setGroupFocused(true); setGroupBioExpanded(false); }} aria-label={`${artistName} ${copy.profile}`} tabIndex={groupFocused ? -1 : undefined}>{artist.logo_url && <Image src={artist.logo_url} alt={`${artistName} logo`} width={240} height={80} /> }<h1>{artistName}</h1></button></div>}
    <MemberDetailOverlay artistName={artistName} member={selectedMember} memberBio={memberBio || ""} panelLeft={Boolean(selectedRegion && outlineCentroid(selectedRegion.outline).x > 56)} groupFocused={groupFocused} groupBio={groupBio} expanded={groupBioExpanded} copy={copy} onClose={closeMember} onNavigate={navigate} onToggleBio={() => setGroupBioExpanded((value) => !value)} />
    <SceneDock artist={artist} member={selectedMember} scenes={memberScenes} activeSceneId={activeScene.id} copy={copy} showReset={Boolean(selectedMember || groupFocused || activeScene.id !== scenes[0]?.id)} onChangeScene={(id) => { setHoveredMemberId(null); setActiveSceneId(id); }} onReset={reset} />
    <div className={styles.sceneSweep} key={`sweep-${activeScene.id}`} aria-hidden="true" />
  </main>;
}
