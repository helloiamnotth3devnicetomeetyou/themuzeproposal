"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { LuArrowLeft, LuArrowRight, LuChevronDown, LuDisc3, LuRotateCcw, LuX } from "react-icons/lu";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useLocale } from "../../context/LocaleContext";
import { supabase } from "@/lib/supabase";
import { normalizeOutline, outlineCentroid, outlineToPath, type ArtistScene } from "@/lib/artist-scenes";
import styles from "./scene.module.css";

type Artist = {
  id: string;
  slug: string;
  name: string;
  eng_name: string | null;
  image_url: string | null;
  logo_url: string | null;
  color: string | null;
  description_ko: string | null;
  description_en: string | null;
  description_ja: string | null;
};

type Member = {
  id: string;
  slug: string;
  name: string;
  eng_name: string | null;
  role_ko: string | null;
  role_en: string | null;
  role_ja: string | null;
  birth: string | null;
  mbti: string | null;
  image_url: string | null;
  color: string | null;
  bio_ko: string | null;
  bio_en: string | null;
  bio_ja: string | null;
  sort_order: number;
};

type SceneDimensions = Record<string, { width: number; height: number }>;
type FrameSize = { width: number; height: number } | null;

const sceneSelect = "id,artist_id,title,image_url,image_width,image_height,is_hero,is_published,sort_order,artist_scene_members(id,member_id,outline,mask_url,sort_order)";

function normalizeScene(value: ArtistScene): ArtistScene {
  return {
    ...value,
    artist_scene_members: (value.artist_scene_members ?? [])
      .map((region) => ({ ...region, outline: normalizeOutline(region.outline) }))
      .filter((region) => region.outline.length >= 3)
      .sort((a, b) => a.sort_order - b.sort_order),
  };
}

function regionForMember(scene: ArtistScene | undefined, memberId: string | null) {
  if (!scene || !memberId) return null;
  return scene.artist_scene_members.find((region) => region.member_id === memberId) ?? null;
}

export default function ArtistSceneExperience({ artistSlug, initialMemberSlug }: { artistSlug: string; initialMemberSlug?: string }) {
  const { locale } = useLocale();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [scenes, setScenes] = useState<ArtistScene[]>([]);
  const [activeSceneId, setActiveSceneId] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isGroupFocused, setIsGroupFocused] = useState(false);
  const [isGroupBioExpanded, setIsGroupBioExpanded] = useState(false);
  const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<SceneDimensions>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const focusWasOpenedHere = useRef(false);
  const sceneStageRef = useRef<HTMLDivElement>(null);
  const [frameSize, setFrameSize] = useState<FrameSize>(null);

  const loadExperience = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data: artistData, error: artistError } = await supabase
      .from("artists")
      .select("id,slug,name,eng_name,image_url,logo_url,color,description_ko,description_en,description_ja")
      .eq("slug", artistSlug)
      .eq("is_active", true)
      .maybeSingle();

    if (artistError || !artistData) {
      setError(artistError?.message || "Artist not found.");
      setLoading(false);
      return;
    }

    const [memberResult, sceneResult] = await Promise.all([
      supabase
        .from("artist_members")
        .select("id,slug,name,eng_name,role_ko,role_en,role_ja,birth,mbti,image_url,color,bio_ko,bio_en,bio_ja,sort_order")
        .eq("artist_id", artistData.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("artist_scenes")
        .select(sceneSelect)
        .eq("artist_id", artistData.id)
        .eq("is_published", true)
        .order("is_hero", { ascending: false })
        .order("sort_order", { ascending: true }),
    ]);

    const nextMembers = (memberResult.data as Member[] | null) ?? [];
    let nextScenes = ((sceneResult.data as unknown as ArtistScene[] | null) ?? []).map(normalizeScene);
    if (!nextScenes.length && artistData.image_url) {
      nextScenes = [{
        id: "legacy-hero",
        artist_id: artistData.id,
        title: "Main scene",
        image_url: artistData.image_url,
        image_width: null,
        image_height: null,
        is_hero: true,
        is_published: true,
        sort_order: 0,
        artist_scene_members: [],
      }];
    }

    setArtist(artistData as Artist);
    setMembers(nextMembers);
    setScenes(nextScenes);
    setActiveSceneId(nextScenes[0]?.id ?? "");
    const initialMember = nextMembers.find((member) => member.slug === initialMemberSlug);
    setSelectedMemberId(initialMember?.id ?? null);
    setError(memberResult.error?.message || (!artistData.image_url && !nextScenes.length ? "No hero scene has been published." : ""));
    setLoading(false);
  }, [artistSlug, initialMemberSlug]);

  useEffect(() => { void Promise.resolve().then(loadExperience); }, [loadExperience]);

  useEffect(() => {
    const syncFromHistory = () => {
      const match = window.location.pathname.match(/^\/[^/]+\/artist\/([^/]+)\/?$/);
      const member = match ? members.find((item) => item.slug === decodeURIComponent(match[1])) : null;
      setSelectedMemberId(member?.id ?? null);
      setIsGroupFocused(false);
      setIsGroupBioExpanded(false);
      setHoveredMemberId(null);
      focusWasOpenedHere.current = false;
    };
    window.addEventListener("popstate", syncFromHistory);
    return () => window.removeEventListener("popstate", syncFromHistory);
  }, [members]);

  const activeScene = scenes.find((scene) => scene.id === activeSceneId) ?? scenes[0];
  const selectedMember = members.find((member) => member.id === selectedMemberId) ?? null;
  const focusMemberId = hoveredMemberId || selectedMemberId;
  const focusRegion = regionForMember(activeScene, focusMemberId);
  const focusRegions = isGroupFocused ? activeScene.artist_scene_members : focusRegion ? [focusRegion] : [];
  const selectedRegion = regionForMember(activeScene, selectedMemberId);
  const artistName = artist?.eng_name || artist?.name || artistSlug.toUpperCase();
  const groupBio = artist
    ? ((locale === "ko" ? artist.description_ko : locale === "ja" ? artist.description_ja : artist.description_en) || artist.description_ko || artist.description_en || artist.description_ja || "")
    : "";
  const accent = selectedMember?.color || artist?.color || "#FC6FCF";
  const currentDimensions = activeScene ? dimensions[activeScene.id] : undefined;
  const sceneWidth = currentDimensions?.width || activeScene?.image_width || 16;
  const sceneHeight = currentDimensions?.height || activeScene?.image_height || 9;
  const sceneRatio = sceneWidth / sceneHeight;

  useEffect(() => {
    const stage = sceneStageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => {
      const availableWidth = entry.contentRect.width;
      const availableHeight = entry.contentRect.height;
      const width = Math.max(availableWidth, availableHeight * sceneRatio);
      setFrameSize({ width, height: width / sceneRatio });
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [sceneRatio]);

  const memberScenes = useMemo(() => {
    if (!selectedMemberId) return scenes;
    return scenes.filter((scene) => scene.artist_scene_members.some((region) => region.member_id === selectedMemberId));
  }, [scenes, selectedMemberId]);

  const activeSceneMembers = useMemo(() => {
    const memberIds = new Set(activeScene?.artist_scene_members.map((region) => region.member_id) ?? []);
    return members.filter((member) => memberIds.has(member.id));
  }, [activeScene, members]);

  const selectMember = (memberId: string) => {
    const member = members.find((item) => item.id === memberId);
    if (!member || !artist) return;
    const commit = () => {
      const nextScene = activeScene?.artist_scene_members.some((region) => region.member_id === memberId)
        ? activeScene
        : scenes.find((scene) => scene.artist_scene_members.some((region) => region.member_id === memberId));
      if (nextScene) setActiveSceneId(nextScene.id);

      const nextPath = `/${artist.slug}/artist/${member.slug}`;
      if (!selectedMemberId) {
        window.history.pushState({ artistMemberFocus: true }, "", nextPath);
        focusWasOpenedHere.current = true;
      } else {
        window.history.replaceState({ artistMemberFocus: true }, "", nextPath);
      }
      setSelectedMemberId(memberId);
      setIsGroupFocused(false);
      setIsGroupBioExpanded(false);
      setHoveredMemberId(null);
    };

    commit();
  };

  const closeMember = () => {
    if (!artist) return;
    if (focusWasOpenedHere.current) {
      focusWasOpenedHere.current = false;
      window.history.back();
      return;
    }
    window.history.replaceState(null, "", `/${artist.slug}/artist`);
    setSelectedMemberId(null);
    setIsGroupFocused(false);
    setIsGroupBioExpanded(false);
    setHoveredMemberId(null);
  };

  const resetToAll = () => {
    if (!artist) return;
    focusWasOpenedHere.current = false;
    window.history.replaceState(null, "", `/${artist.slug}/artist`);
    setSelectedMemberId(null);
    setIsGroupFocused(false);
    setIsGroupBioExpanded(false);
    setHoveredMemberId(null);
    setActiveSceneId(scenes[0]?.id ?? "");
  };
  const openGroupFocus = () => {
    setHoveredMemberId(null);
    setSelectedMemberId(null);
    setIsGroupFocused(true);
    setIsGroupBioExpanded(false);
  };

  useEffect(() => {
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && (selectedMemberId || isGroupFocused)) closeMember();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  });

  const changeScene = (sceneId: string) => {
    if (sceneId === activeScene?.id) return;
    setHoveredMemberId(null);
    setActiveSceneId(sceneId);
  };

  const navigateMembers = (direction: -1 | 1) => {
    if (activeSceneMembers.length < 2) return;
    const index = activeSceneMembers.findIndex((member) => member.id === selectedMemberId);
    if (index < 0) return;
    const next = activeSceneMembers[(index + direction + activeSceneMembers.length) % activeSceneMembers.length];
    selectMember(next.id);
  };

  if (loading) return <main className={styles.statePage}><LoadingIndicator label="Loading artist scene" /></main>;
  if (!artist || !activeScene) return <main className={styles.statePage}><b>404</b><span>{error || "Artist scene not found."}</span><Link href="/artists">Back to artists</Link></main>;

  const copy = locale === "ko"
    ? { select: "멤버를 선택하세요", scene: "콘셉트 장면", close: "프로필 닫기", previous: "이전 멤버", next: "다음 멤버", discography: "디스코그래피", profile: "프로필", groupProfile: "아티스트 프로필", expand: "소개 펼치기", collapse: "소개 접기" }
    : locale === "ja"
      ? { select: "メンバーを選択", scene: "コンセプトシーン", close: "プロフィールを閉じる", previous: "前のメンバー", next: "次のメンバー", discography: "ディスコグラフィー", profile: "プロフィール", groupProfile: "アーティストプロフィール", expand: "紹介を開く", collapse: "紹介を閉じる" }
      : { select: "Select a member", scene: "Concept scenes", close: "Close profile", previous: "Previous member", next: "Next member", discography: "Discography", profile: "Profile", groupProfile: "Artist profile", expand: "Show introduction", collapse: "Hide introduction" };
  const memberRole = selectedMember ? ((locale === "ko" ? selectedMember.role_ko : locale === "ja" ? selectedMember.role_ja : selectedMember.role_en) || selectedMember.role_ko || "") : "";
  const memberBio = selectedMember ? ((locale === "ko" ? selectedMember.bio_ko : locale === "ja" ? selectedMember.bio_ja : selectedMember.bio_en) || selectedMember.bio_ko || "") : "";
  const panelSide = selectedRegion && outlineCentroid(selectedRegion.outline).x > 56 ? styles.panelLeft : styles.panelRight;
  const zoomCenter = selectedRegion ? outlineCentroid(selectedRegion.outline) : { x: 50, y: 50 };
  const cameraOffset = { x: (50 - zoomCenter.x) * .14, y: (50 - zoomCenter.y) * .1 };

  return (
    <main className={`${styles.experience} ${selectedMember || isGroupFocused ? styles.hasSelection : ""}`} style={{ "--artist-accent": accent } as CSSProperties}>
      <div className={styles.sceneBackdrop} key={`backdrop-${activeScene.id}`} aria-hidden="true"><img src={activeScene.image_url} alt="" /></div>
      <section className={styles.sceneViewport} aria-label={`${artistName} ${activeScene.title || copy.scene}`}>
        <div ref={sceneStageRef} className={styles.sceneStage}>
        <div
          className={styles.sceneFrame}
          onClick={() => {
            if (selectedMember || isGroupFocused) closeMember();
          }}
          style={{
            "--scene-ratio": sceneRatio,
            width: frameSize?.width,
            height: frameSize?.height,
            transformOrigin: "50% 50%",
            transform: selectedMember ? `translate(${cameraOffset.x}%, ${cameraOffset.y}%) scale(1.16)` : "translate(0, 0) scale(1)",
          } as CSSProperties}
        >
          <img
            key={activeScene.id}
            src={activeScene.image_url}
            alt={`${artistName} ${activeScene.title || copy.scene}`}
            className={styles.sceneImage}
            onLoad={(event) => {
              const image = event.currentTarget;
              setDimensions((current) => ({ ...current, [activeScene.id]: { width: image.naturalWidth, height: image.naturalHeight } }));
            }}
          />
          {focusRegions.map((region) => {
            const path = outlineToPath(region.outline);
            if (!path) return null;
            return (
            <svg key={region.id} className={styles.focusExposure} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <filter id={`feather-${region.id}`} x="-25%" y="-25%" width="150%" height="150%">
                  <feGaussianBlur stdDeviation="2.4" />
                </filter>
                <mask id={`mask-${region.id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100" className={styles.alphaMask}>
                  {region.mask_url
                    ? <image href={region.mask_url} x="0" y="0" width="100" height="100" preserveAspectRatio="none" filter={`url(#feather-${region.id})`} />
                    : <path d={path} fill="white" filter={`url(#feather-${region.id})`} />}
                </mask>
              </defs>
              <image
                href={activeScene.image_url}
                x="0"
                y="0"
                width="100"
                height="100"
                preserveAspectRatio="none"
                mask={`url(#mask-${region.id})`}
              />
            </svg>
            );
          })}
          <svg className={styles.hitMap} viewBox="0 0 100 100" preserveAspectRatio="none" aria-label={copy.select}>
            {activeScene.artist_scene_members.map((region) => {
              const member = members.find((item) => item.id === region.member_id);
              const path = outlineToPath(region.outline);
              if (!member || !path) return null;
              const isFocused = isGroupFocused || focusMemberId === member.id;
              return (
                <path
                  key={region.id}
                  d={path}
                  className={`${styles.hitRegion} ${isFocused ? styles.isFocusedRegion : ""}`}
                  aria-hidden="true"
                  onPointerEnter={() => setHoveredMemberId(member.id)}
                  onPointerLeave={() => setHoveredMemberId(null)}
                  onClick={(event) => {
                    event.stopPropagation();
                    selectMember(member.id);
                  }}
                />
              );
            })}
          </svg>
        </div>
        </div>
      </section>

      <header className={styles.sceneHeader}>
        <div><span>ARTIST SCENE</span><b>{activeScene.title || `SCENE ${String(activeScene.sort_order + 1).padStart(2, "0")}`}</b></div>
        <p>{String(Math.max(1, scenes.findIndex((scene) => scene.id === activeScene.id) + 1)).padStart(2, "0")} / {String(scenes.length).padStart(2, "0")}</p>
      </header>

      {!selectedMember && (
        <div className={`${styles.artistIdentity} ${isGroupFocused ? styles.identityHidden : ""}`} aria-hidden={isGroupFocused}>
          <button type="button" className={styles.artistWordmark} onClick={openGroupFocus} aria-label={`${artistName} profile`} tabIndex={isGroupFocused ? -1 : undefined}>
            {artist.logo_url && <img src={artist.logo_url} alt={`${artistName} logo`} />}
            <h1>{artistName}</h1>
          </button>
        </div>
      )}

      {selectedMember && (
        <aside key={selectedMember.id} className={`${styles.profilePanel} ${panelSide}`} aria-live="polite">
          <button type="button" className={styles.closeButton} onClick={closeMember} aria-label={copy.close}><LuX aria-hidden="true" /></button>
          <div className={styles.profileIndex}><b>{String(selectedMember.sort_order).padStart(2, "0")}</b></div>
          <h1>{selectedMember.eng_name || selectedMember.name}</h1>
          <p className={styles.nativeName}>{selectedMember.name}</p>
          <div className={styles.memberBio}><span>{memberRole || copy.profile}</span><p>{memberBio || memberRole}</p></div>
          {activeSceneMembers.length > 1 && (
            <div className={styles.memberArrows}>
              <button type="button" onClick={() => navigateMembers(-1)} aria-label={copy.previous}><LuArrowLeft aria-hidden="true" /></button>
              <button type="button" onClick={() => navigateMembers(1)} aria-label={copy.next}><LuArrowRight aria-hidden="true" /></button>
            </div>
          )}
        </aside>
      )}

      {isGroupFocused && (
        <aside className={`${styles.profilePanel} ${styles.groupPanel} ${styles.panelLeft}`} aria-live="polite">
          <button type="button" className={styles.closeButton} onClick={closeMember} aria-label={copy.close}><LuX aria-hidden="true" /></button>
          <span className={styles.groupEyebrow}>{copy.groupProfile}</span>
          <h1>{artistName}</h1>
          {groupBio && (
            <div className={`${styles.groupBio} ${isGroupBioExpanded ? styles.isGroupBioExpanded : ""}`}>
              <p id="group-artist-bio">{groupBio}</p>
              <button type="button" className={styles.groupBioToggle} aria-expanded={isGroupBioExpanded} aria-controls="group-artist-bio" onClick={() => setIsGroupBioExpanded((current) => !current)}>
                {isGroupBioExpanded ? copy.collapse : copy.expand}
                <LuChevronDown aria-hidden="true" />
              </button>
            </div>
          )}
        </aside>
      )}
      <div className={styles.bottomDock}>
        {selectedMember && (
          <div className={styles.sceneStrip} aria-label={`${selectedMember.eng_name || selectedMember.name} ${copy.scene}`}>
            <div className={styles.sceneCards}>
              {memberScenes.map((scene, index) => (
                <button key={scene.id} type="button" className={scene.id === activeScene.id ? styles.isActiveScene : ""} onClick={() => changeScene(scene.id)}>
                  <img src={scene.image_url} alt="" />
                  <span className={styles.sceneCardIndex}>{String(index + 1).padStart(2, "0")}</span>
                  <span className={styles.sceneCardTitle}>{scene.title || `SCENE ${String(index + 1).padStart(2, "0")}`}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {!selectedMember && <div className={styles.dockSpacer} />}
        <Link href={`/${artist.slug}/discography`} className={styles.discographyLink}><LuDisc3 aria-hidden="true" />{copy.discography}</Link>
        {(selectedMember || isGroupFocused || activeScene.id !== scenes[0]?.id) && <button type="button" className={styles.resetButton} onClick={resetToAll}><LuRotateCcw aria-hidden="true" />ALL</button>}
      </div>
      <div className={styles.sceneSweep} key={`sweep-${activeScene.id}`} aria-hidden="true" />
    </main>
  );
}
