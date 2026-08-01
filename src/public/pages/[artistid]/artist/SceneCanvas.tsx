import Image from "next/image";
import type { CSSProperties } from "react";
import { outlineToPath, type ArtistScene } from "@/core/utils/artist-scenes";
import type { Member } from "./artist-scene-types";
import styles from "@/styles/(public)/pages/artist-scene.module.css";

type Props = { scene: ArtistScene; members: Member[]; artistName: string; sceneLabel: string; focusMemberId: string | null; groupFocused: boolean; selectedMember: boolean; cameraOffset: { x: number; y: number }; onClose: () => void; onHover: (id: string | null) => void; onSelect: (id: string) => void };

export default function SceneCanvas({ scene, members, artistName, sceneLabel, focusMemberId, groupFocused, selectedMember, cameraOffset, onClose, onHover, onSelect }: Props) {
  const focusRegions = groupFocused ? scene.artist_scene_members : focusMemberId ? scene.artist_scene_members.filter((region) => region.member_id === focusMemberId) : [];
  const ratio = (scene.image_width || 16) / (scene.image_height || 9);
  const imageWidth = scene.image_width || 1600;
  const imageHeight = scene.image_height || 900;
  return <>
    <div className={styles.sceneBackdrop} key={`backdrop-${scene.id}`} aria-hidden="true"><Image src={scene.image_url} alt="" width={imageWidth} height={imageHeight} loading="eager" sizes="100vw" className={styles.sceneImage} /></div>
    <section className={styles.sceneViewport} aria-label={`${artistName} ${scene.title || sceneLabel}`}><div className={styles.sceneStage}><div className={styles.sceneFrame} onClick={onClose} style={{ "--scene-ratio": ratio, transformOrigin: "50% 50%", transform: selectedMember ? `translate(${cameraOffset.x}%, ${cameraOffset.y}%) scale(1.16)` : "translate(0, 0) scale(1)" } as CSSProperties}>
      <Image key={scene.id} src={scene.image_url} alt={`${artistName} ${scene.title || sceneLabel}`} width={imageWidth} height={imageHeight} preload fetchPriority="high" sizes="100vw" className={styles.sceneImage} draggable={false} />
      {focusRegions.map((region) => { const path = outlineToPath(region.outline); if (!path) return null; return <svg key={region.id} className={styles.focusExposure} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><filter id={`feather-${region.id}`} x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="2.4" /></filter><mask id={`mask-${region.id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100" className={styles.alphaMask}>{region.mask_url ? <image href={region.mask_url} x="0" y="0" width="100" height="100" preserveAspectRatio="none" filter={`url(#feather-${region.id})`} /> : <path d={path} fill="var(--color-static-white)" filter={`url(#feather-${region.id})`} />}</mask></defs><image href={scene.image_url} x="0" y="0" width="100" height="100" preserveAspectRatio="none" mask={`url(#mask-${region.id})`} /></svg>; })}
      <svg className={styles.hitMap} viewBox="0 0 100 100" preserveAspectRatio="none" aria-label={sceneLabel}>{scene.artist_scene_members.map((region) => { const member = members.find((item) => item.id === region.member_id); const path = outlineToPath(region.outline); if (!member || !path) return null; return <path key={region.id} d={path} className={`${styles.hitRegion} ${groupFocused || focusMemberId === member.id ? styles.isFocusedRegion : ""}`} aria-hidden="true" onPointerEnter={() => onHover(member.id)} onPointerLeave={() => onHover(null)} onClick={(event) => { event.stopPropagation(); onSelect(member.id); }} />; })}</svg>
    </div></div></section>
  </>;
}
