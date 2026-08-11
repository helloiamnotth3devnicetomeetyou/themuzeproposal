"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { uploadAdminAsset } from "@/admin/utils/upload-admin-asset";
import { useFocusTrap } from "@/admin/hooks/useFocusTrap";
import { finishGuideSandbox, isGuideSandboxActive } from "@/core/supabase/guide-sandbox";

const CLIP_SECONDS = 12;
const MAX_VIDEO_BYTES = 18 * 1024 * 1024;

type Props = {
  slideId: string;
  videoUrl: string | null;
  disabled: boolean;
  onChange: (videoUrl: string | null) => Promise<void>;
  onStatus: (message: string | null) => void;
};

export default function HeroVideoClipEditor({ slideId, videoUrl, disabled, onChange, onStatus }: Props) {
  const previewRef = useRef<HTMLVideoElement>(null);
  const [source, setSource] = useState<string | null>(videoUrl);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<"uploading" | null>(null);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [draggingFile, setDraggingFile] = useState(false);
  const [hasSourceFile, setHasSourceFile] = useState(false);
  const guideSandboxActive = useSyncExternalStore(() => () => {}, isGuideSandboxActive, () => false);
  const fileRef = useRef<File | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const dialogRef = useFocusTrap<HTMLElement>(open);

  useEffect(() => () => { if (source?.startsWith("blob:")) URL.revokeObjectURL(source); }, [source]);
  useEffect(() => {
    if (!stage) return onStatus(null);
    const label = "WebM 업로드 중";
    onStatus(`${label} ${progress}%`);
  }, [onStatus, progress, stage]);

  const selectFile = (file: File | null) => {
    if (!file) return;
    if (file.type !== "video/mp4" && !file.name.toLowerCase().endsWith(".mp4")) { setError("FHD H.264 MP4 파일만 선택할 수 있습니다."); return; }
    if (file.size > MAX_VIDEO_BYTES) { setError("영상은 18MB 이하여야 합니다."); return; }
    if (source?.startsWith("blob:")) URL.revokeObjectURL(source);
    fileRef.current = file;
    setHasSourceFile(true);
    setSource(URL.createObjectURL(file));
    setDuration(0);
    setStart(0);
    setError("");
  };

  const convertAndUpload = async () => {
    if (guideSandboxActive) {
      setError("연습 모드에서는 영상이 실제로 저장되지 않습니다. 연습 모드를 종료한 뒤 다시 시도하세요.");
      return;
    }
    const file = fileRef.current;
    if (!file || duration < CLIP_SECONDS) return;
    setBusy(true);
    setStage("uploading");
    setProgress(0);
    setError("");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const asset = await uploadAdminAsset("hero-videos", `clips/${slideId}/${crypto.randomUUID()}.mp4`, file, {
        signal: controller.signal,
        onProgress: (nextProgress) => setProgress(Math.round(nextProgress * 100)),
      });
      await onChange(`${asset.url}#t=${start.toFixed(1)},${(start + CLIP_SECONDS).toFixed(1)}`);
      fileRef.current = null;
      setHasSourceFile(false);
      setSource(asset.url);
      setDuration(CLIP_SECONDS);
      setStart(0);
      setOpen(false);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") setError("");
      else setError(cause instanceof Error ? cause.message : typeof cause === "string" ? cause : "변환 엔진이 응답하지 않았습니다. MP4(H.264) 원본으로 다시 시도하세요.");
    } finally {
      setBusy(false);
      setStage(null);
      abortRef.current = null;
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
  };

  const closeModal = () => busy ? cancel() : setOpen(false);

  const leaveGuideSandbox = () => window.location.assign(finishGuideSandbox() || window.location.href);

  const maxStart = Math.max(0, duration - CLIP_SECONDS);
  const clipStatus = videoUrl
      ? "12초 FHD MP4 저장됨"
    : hasSourceFile
      ? "원본 선택됨 · 12초 클립 저장 필요"
      : "등록된 영상 없음";
  return (
    <section className="hero-video-summary" onPointerDown={(event) => event.stopPropagation()}>
      <div><b>히어로 영상</b><span className={videoUrl ? "is-pending-save" : undefined}>{clipStatus}</span></div>
      {guideSandboxActive
        ? <button type="button" className="hero-video-open" onClick={leaveGuideSandbox}>연습 모드 종료</button>
        : <button type="button" className="hero-video-open" disabled={disabled} onClick={() => setOpen(true)}>{videoUrl ? "영상 편집" : "영상 추가"}</button>}
      {open && typeof document !== "undefined" && createPortal(<div className="delete-confirm-backdrop hero-video-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) closeModal(); }}>
        <section ref={dialogRef} className="delete-confirm-dialog hero-video-editor" role="dialog" aria-modal="true" aria-labelledby={`hero-video-title-${slideId}`} onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); closeModal(); } }}>
          <header className="hero-video-editor-heading"><div><span>HERO VIDEO</span><b id={`hero-video-title-${slideId}`}>12초 영상 저장</b></div></header>
          <p className="hero-video-editor-description">FHD H.264 MP4에서 원하는 12초 구간만 메인 슬라이드에 저장합니다.</p>
          <div className="hero-video-workspace">
            <div className="hero-video-preview-pane">{source ? <video ref={previewRef} src={source} muted controls playsInline className="hero-video-preview" onLoadedMetadata={(event) => {
              const nextDuration = event.currentTarget.duration;
              setDuration(nextDuration);
              setStart((current) => Math.min(current, Math.max(0, nextDuration - CLIP_SECONDS)));
            }} /> : <p>영상을 선택하면 여기에 미리보기가 표시됩니다.</p>}</div>
            <div className="hero-video-controls">
              <label className={`hero-video-file ${draggingFile ? "is-dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDraggingFile(true); }} onDragLeave={() => setDraggingFile(false)} onDrop={(event) => { event.preventDefault(); setDraggingFile(false); selectFile(event.dataTransfer.files[0] ?? null); }}><span>{videoUrl ? "새 FHD H.264 MP4 영상을 끌어놓거나 선택하세요" : "FHD H.264 MP4 영상을 끌어놓거나 선택하세요"}</span><small>1920×1080 H.264 MP4 · 선택한 12초 구간만 저장됩니다</small><input type="file" accept="video/mp4,.mp4" disabled={disabled || busy} onChange={(event) => selectFile(event.target.files?.[0] ?? null)} /></label>
              {hasSourceFile && duration >= CLIP_SECONDS && <label className="hero-video-range"><span>선택 구간 {start.toFixed(1)}초 - {(start + CLIP_SECONDS).toFixed(1)}초</span><input type="range" min="0" max={maxStart} step="0.1" value={start} disabled={disabled || busy} style={{ "--range-progress": `${maxStart ? start / maxStart * 100 : 0}%` } as React.CSSProperties} onChange={(event) => { const next = Number(event.target.value); setStart(next); if (previewRef.current) previewRef.current.currentTime = next; }} /></label>}
              {hasSourceFile && duration > 0 && duration < CLIP_SECONDS && <p className="hero-video-error">12초 이상의 영상을 선택하세요.</p>}
              {stage && <div className="hero-video-progress" role="status"><div><b>업로드 중</b><span>{progress}%</span></div><i style={{ "--progress": `${progress}%` } as React.CSSProperties} /></div>}
              {error && <p className="hero-video-error">{error}</p>}
            </div>
          </div>
          <div className="delete-confirm-actions hero-video-actions">
            {videoUrl && <button type="button" className="hero-video-remove" disabled={disabled || busy} onClick={() => void onChange(null).then(() => setSource(null)).catch((cause) => setError(cause instanceof Error ? cause.message : "영상을 제거하지 못했습니다."))}>영상 제거</button>}
            <span />
            <button type="button" className="admin-btn admin-btn-secondary" onClick={closeModal}>{busy ? "작업 취소" : "취소"}</button>
            <button type="button" className="admin-btn hero-video-convert" disabled={disabled || busy || !hasSourceFile || duration < CLIP_SECONDS} onClick={() => void convertAndUpload()}>{busy ? "저장 중" : "12초 저장"}</button>
          </div>
        </section>
      </div>, document.body)}
    </section>
  );
}
