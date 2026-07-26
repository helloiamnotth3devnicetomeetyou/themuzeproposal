import Image from "next/image";
import Link from "next/link";
import { LuDisc3, LuExternalLink, LuRotateCcw } from "react-icons/lu";
import { getEnglishFirstMemberName, type Artist, type Member, type SceneCopy } from "./artist-scene-types";
import { normalizeSceneLink, type ArtistScene } from "@/core/utils/artist-scenes";
import styles from "@/styles/(public)/pages/artist-scene.module.css";

export default function SceneDock({ artist, member, scenes, activeSceneId, copy, showReset, onChangeScene, onReset }: { artist: Artist; member: Member | null; scenes: ArtistScene[]; activeSceneId: string; copy: SceneCopy; showReset: boolean; onChangeScene: (id: string) => void; onReset: () => void }) {
  const memberName = member ? getEnglishFirstMemberName(member) : "";
  const activeSceneLink = normalizeSceneLink(scenes.find((scene) => scene.id === activeSceneId)?.link_url);
  const isExternalLink = activeSceneLink?.startsWith("http");
  const faviconUrl = activeSceneLink
    ? activeSceneLink.startsWith("/")
      ? "/favicon.ico"
      : `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(activeSceneLink)}&sz=64`
    : null;
  return <div className={styles.bottomDock}>{member ? <div className={styles.sceneStrip} aria-label={`${memberName} ${copy.scene}`}><div className={styles.sceneCards}>{scenes.map((scene, index) => <button key={scene.id} type="button" className={scene.id === activeSceneId ? styles.isActiveScene : ""} style={{ animationDelay: `${index * 75}ms` }} onClick={() => onChangeScene(scene.id)}><Image src={scene.image_url} alt="" fill sizes="160px" /><span className={styles.sceneCardIndex}>{String(index + 1).padStart(2, "0")}</span></button>)}</div></div> : <div className={styles.dockSpacer} />}{activeSceneLink && faviconUrl && <a href={activeSceneLink} className={styles.sceneLinkButton} aria-label={copy.openLink} title={copy.openLink} target={isExternalLink ? "_blank" : undefined} rel={isExternalLink ? "noreferrer" : undefined}><LuExternalLink aria-hidden="true" /><span className={styles.sceneLinkFavicon} style={{ backgroundImage: `url(${JSON.stringify(faviconUrl)})` }} aria-hidden="true" /></a>}<Link href={`/${artist.slug}/discography`} className={styles.discographyLink}><LuDisc3 aria-hidden="true" />{copy.discography}</Link>{showReset && <button type="button" className={styles.resetButton} onClick={onReset}><LuRotateCcw aria-hidden="true" />ALL</button>}</div>;
}
