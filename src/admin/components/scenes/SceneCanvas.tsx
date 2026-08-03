"use client";

import { useMemo, useState, type PointerEvent } from "react";
import { MousePointer2, Move, ZoomIn, ZoomOut } from "lucide-react";
import { outlineToPath, type ArtistScene, type ScenePoint } from "@/core/utils/artist-scenes";
import styles from "@/styles/(admin)/components/scenes/ArtistSceneManager.module.css";
import AdminAssetImage from "@/admin/components/assets/AdminAssetImage";

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
  const [zoom, setZoom] = useState(1);
  const [panMode, setPanMode] = useState(false);
  const pointFromEvent = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)),
    };
  };

  const startOutline = (event: PointerEvent<SVGSVGElement>) => {
    if (!selectedMemberId || panMode) return;
    drawingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraftOutline([pointFromEvent(event)]);
  };

  const continueOutline = (event: PointerEvent<SVGSVGElement>) => {
    if (!drawingRef.current || panMode) return;
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
      <div className={styles.canvasControls} aria-label="장면 확대 및 이동">
        <button type="button" onClick={() => setZoom((value) => Math.max(1, value - .5))} disabled={zoom === 1} aria-label="축소"><ZoomOut aria-hidden="true" /></button>
        <span>{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setZoom((value) => Math.min(3, value + .5))} disabled={zoom === 3} aria-label="확대"><ZoomIn aria-hidden="true" /></button>
        <button type="button" className={panMode ? styles.isActiveControl : ""} onClick={() => setPanMode((value) => !value)} aria-pressed={panMode} disabled={zoom === 1} aria-label="화면 이동 모드"><Move aria-hidden="true" /></button>
      </div>
      <div
        className={`${styles.canvas} ${panMode ? styles.isPanning : ""}`}
        style={{ aspectRatio: sceneRatio, width: `${zoom * 100}%` }}
      >
        <AdminAssetImage
          src={selectedScene.image_url}
          alt={selectedScene.title}
          sizes="(max-width: 900px) 100vw, 720px"
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
          <MousePointer2 aria-hidden="true" />
          {panMode ? "화면을 밀어 편집 위치를 이동하세요" : "멤버 외곽선을 손가락이나 포인터로 그리세요"}
        </div>
      </div>
    </div>
  );
}
