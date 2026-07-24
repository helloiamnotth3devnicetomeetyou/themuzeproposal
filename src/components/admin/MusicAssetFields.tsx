"use client";

/* eslint-disable @next/next/no-img-element */
import { type DragEvent, useId, useState } from "react";
import { LuImage, LuMusic, LuX } from "react-icons/lu";
import { supabase } from "@/lib/supabase";
import type { UploadedAsset } from "@/lib/music-editor";

type CoverProps = {
  artistId: string;
  albumId: string;
  value: string;
  onUploaded: (asset: UploadedAsset, suggestedColor: string) => void;
  onError: (message: string) => void;
};

type HeroProps = {
  artistId: string;
  albumId: string;
  value: string;
  onUploaded: (asset: UploadedAsset) => void;
  onClear: () => void;
  onError: (message: string) => void;
};

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function hex(value: number) {
  return Math.round(value).toString(16).padStart(2, "0");
}

async function getSuggestedColor(file: File) {
  const source = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("이미지를 읽을 수 없습니다."));
      element.src = source;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 12; canvas.height = 12;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context?.drawImage(image, 0, 0, 12, 12);
    const pixels = context?.getImageData(0, 0, 12, 12).data;
    let r = 0, g = 0, b = 0, count = 0;
    if (pixels) for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3] < 128) continue;
      r += pixels[index]; g += pixels[index + 1]; b += pixels[index + 2]; count += 1;
    }
    return count ? `#${hex(r / count)}${hex(g / count)}${hex(b / count)}`.toUpperCase() : "#FC6FCF";
  } finally {
    URL.revokeObjectURL(source);
  }
}

async function upload(bucket: UploadedAsset["bucket"], path: string, body: Blob, contentType: string) {
  const { error } = await supabase.storage.from(bucket).upload(path, body, { contentType, upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { bucket, path, url: data.publicUrl } satisfies UploadedAsset;
}

export function CoverAssetField({ artistId, albumId, value, onUploaded, onError }: CoverProps) {
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  const choose = async (file?: File) => {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) return onError("커버는 JPG, PNG, WebP 파일만 올릴 수 있습니다.");
    if (file.size > 30 * 1024 * 1024) return onError("커버 파일은 30MB 이하여야 합니다.");
    setBusy(true);
    try {
      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const [asset, suggested] = await Promise.all([
        upload("album-covers", `${artistId}/${albumId}/cover/${crypto.randomUUID()}.${extension}`, file, file.type),
        getSuggestedColor(file),
      ]);
      onUploaded(asset, suggested);
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "커버 업로드에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (!busy) void choose(event.dataTransfer.files?.[0]);
  };

  return <div className={`music-cover-field music-image-dropzone ${dragging ? "is-dragging" : ""}`} onDragEnter={(event) => { event.preventDefault(); if (!busy) setDragging(true); }} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }} onDrop={drop}>
    <div className="music-cover-preview">
      {value ? <img src={value} alt="앨범 커버" /> : <span>커버 없음</span>}
    </div>
    <div className="music-asset-copy">
      <b>앨범 커버</b><p>파일을 여기에 놓거나 선택하세요 · 원본 그대로 저장 · JPG, PNG, WebP · 최대 30MB</p>
      <label className="music-upload-button" htmlFor={inputId}>{busy ? "업로드 중…" : value ? "이미지 교체" : "파일 선택"}</label>
      <input id={inputId} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => { void choose(event.target.files?.[0]); event.currentTarget.value = ""; }} />
    </div>
  </div>;
}

export function HeroAssetField({ artistId, albumId, value, onUploaded, onClear, onError }: HeroProps) {
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  const choose = async (file?: File) => {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) return onError("히어로 이미지는 JPG, PNG, WebP 파일만 올릴 수 있습니다.");
    if (file.size > 30 * 1024 * 1024) return onError("히어로 이미지는 30MB 이하여야 합니다.");
    setBusy(true);
    try {
      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${artistId}/${albumId}/hero/${crypto.randomUUID()}.${extension}`;
      onUploaded(await upload("album-covers", path, file, file.type));
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "히어로 이미지 업로드에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (!busy) void choose(event.dataTransfer.files?.[0]);
  };

  return <div className={`music-hero-field music-image-dropzone ${dragging ? "is-dragging" : ""}`} onDragEnter={(event) => { event.preventDefault(); if (!busy) setDragging(true); }} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }} onDrop={drop}>
    <div className="music-hero-preview">{value ? <img src={value} alt="메인 슬라이드 히어로" /> : <span>16:9 HERO IMAGE</span>}</div>
    <div className="music-asset-copy">
      <b>메인 슬라이드 히어로 이미지</b>
      <p>파일을 여기에 놓거나 선택하세요 · 원본 그대로 저장 · 16:9 권장 · JPG, PNG, WebP · 최대 30MB</p>
      <div className="music-hero-actions">
        <label className="music-upload-button" htmlFor={inputId}>{busy ? "업로드 중…" : value ? "이미지 교체" : "파일 선택"}</label>
        {value && <button type="button" className="music-upload-button is-quiet" disabled={busy} onClick={onClear}>제거</button>}
      </div>
      <input id={inputId} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => { void choose(event.target.files?.[0]); event.currentTarget.value = ""; }} />
    </div>
  </div>;
}

type AssetProps = {
  label: string;
  hint: string;
  accept: string;
  maxBytes: number;
  artistId: string;
  albumId: string;
  trackId: string;
  kind: "audio" | "logo";
  value: string;
  onUploaded: (asset: UploadedAsset) => void;
  onClear: () => void;
  onError: (message: string) => void;
};

export function TrackAssetField({ label, hint, accept, maxBytes, artistId, albumId, trackId, kind, value, onUploaded, onClear, onError }: AssetProps) {
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const choose = async (file?: File) => {
    if (!file) return;
    const accepted = accept.split(",");
    const acceptedByExtension = accepted.some((item) => item.startsWith(".") && file.name.toLowerCase().endsWith(item));
    if (!accepted.includes(file.type) && !acceptedByExtension) return onError(`${label} 파일 형식을 확인해 주세요.`);
    if (file.size > maxBytes) return onError(`${label} 파일 용량이 제한을 넘었습니다.`);
    setBusy(true);
    try {
      const extension = kind === "audio"
        ? "mp3"
        : file.type === "image/png"
          ? "png"
          : "webp";
      const path = `${artistId}/${albumId}/${trackId}/${kind}-${crypto.randomUUID()}.${extension}`;
      onUploaded(await upload("track-assets", path, file, kind === "audio" ? "audio/mpeg" : file.type));
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : `${label} 업로드에 실패했습니다.`);
    } finally { setBusy(false); }
  };

  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (!busy) void choose(event.dataTransfer.files?.[0]);
  };

  return <div
    className={`track-asset-field ${value ? "has-file" : ""} ${dragging ? "is-dragging" : ""}`}
    onDragEnter={(event) => { event.preventDefault(); if (!busy) setDragging(true); }}
    onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; }}
    onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }}
    onDrop={drop}
  >
    {kind === "logo" && value
      ? <span className="track-asset-logo-preview"><img src={value} alt="업로드한 타이포 로고" /></span>
      : <span className="track-asset-icon">{kind === "audio" ? <LuMusic aria-hidden="true" /> : <LuImage aria-hidden="true" />}</span>}
    <span className="track-asset-copy"><b>{label}</b><small>{busy ? "업로드 중…" : dragging ? "여기에 놓아 업로드" : value ? "업로드 완료" : hint}</small></span>
    {value && <a href={value} target="_blank" rel="noreferrer">보기</a>}
    <label htmlFor={inputId}>{value ? "교체" : "업로드"}</label>
    {value && <button type="button" onClick={onClear} aria-label={`${label} 제거`}><LuX aria-hidden="true" /></button>}
    <input id={inputId} className="sr-only" type="file" accept={accept} disabled={busy} onChange={(event) => { void choose(event.target.files?.[0]); event.currentTarget.value = ""; }} />
  </div>;
}
