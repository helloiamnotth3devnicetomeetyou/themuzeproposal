"use client";

import { useMemo, type PointerEvent } from "react";
import { LuMousePointer2 } from "react-icons/lu";
import { outlineToPath, type ArtistScene, type ScenePoint } from "@/lib/artist-scenes";
import styles from "./ArtistSceneManager.module.css";

interface SceneCanvasProps {
  selectedScene: ArtistScene;
  selectedMemberId: string | null;
  draftOutline: ScenePoint[];
  setDraftOutline: React.Dispatch<React.SetStateAction<ScenePoint[]>>;
  drawingRef: React.MutableRefObject<boolean>;
  syncSceneDimensions: (width: number, height: number) => void;
  simplifyOutline: (points: ScenePoint[]) => ScenePoint[];
  sceneRatio: number;
}

export default function SceneCanvas({
  selectedScene,
  selectedMemberId,
  draftOutline,
  setDraftOutline,
  drawingRef,
  syncSceneDimensions,
  simplifyOutline,
  sceneRatio,
}: SceneCanvasProps) {
  const pointFromEvent = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)),
    };
  };

  const startOutline = (event: PointerEvent<SVGSVGElement>) => {
    if (!selectedMemberId) return;
    drawingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraftOutline([pointFromEvent(event)]);
  };

  const continueOutline = (event: PointerEvent<SVGSVGElement>) => {
    if (!drawingRef.current) return;
    const next = pointFromEvent(event);
    setDraftOutline((current) => {
      const previous = current[current.length - 1];
      if (previous && Math.hypot(next.x - previous.x, next.y - previous.y) < 0.16) return current;
      return [...current, next];
    });
  };

  const finishOutline = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    setDraftOutline((current) => simplifyOutline(current));
  };

  const renderedOutline = useMemo(() => outlineToPath(draftOutline), [draftOutline]);

  return (
    <div className={styles.canvasWrap}>
      <div className={styles.canvas} style={{ aspectRatio: sceneRatio }}>
        <img
          src={selectedScene.image_url}
          alt={selectedScene.title}
          draggable={false}
          onLoad={(event) => syncSceneDimensions(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)}
        />
        <div className={styles.safeArea} aria-hidden="true">
          <span>확대 안전 영역 · 116%</span>
        </div>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          onPointerDown={startOutline}
          onPointerMove={continueOutline}
          onPointerUp={finishOutline}
          onPointerCancel={finishOutline}
        >
          {selectedScene.artist_scene_members
            .filter((region) => region.member_id !== selectedMemberId)
            .map((region) => (
              <path key={region.id} d={outlineToPath(region.outline)} className={styles.savedOutline} />
            ))}
          {renderedOutline && <path d={renderedOutline} className={styles.draftOutline} />}
          {draftOutline.map((point, index) =>
            index % Math.max(1, Math.floor(draftOutline.length / 28)) === 0 ? (
              <circle key={`${point.x}-${point.y}-${index}`} cx={point.x} cy={point.y} r={0.22} />
            ) : null
          )}
        </svg>
        <div className={styles.canvasHint}>
          <LuMousePointer2 aria-hidden="true" />
          인물 외곽을 누른 채 한 바퀴 그리세요
        </div>
      </div>
    </div>
  );
}
