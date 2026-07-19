"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useId, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { UploadedAsset } from "@/lib/music-editor";

type CoverProps = {
  artistId: string;
  albumId: string;
  value: string;
  onUploaded: (asset: UploadedAsset, suggestedColor: string) => void;
  onError: (message: string) => void;
};

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function hex(value: number) {
  return Math.round(value).toString(16).padStart(2, "0");
}

async function upload(bucket: UploadedAsset["bucket"], path: string, body: Blob, contentType: string) {
  const { error } = await supabase.storage.from(bucket).upload(path, body, { contentType, upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { bucket, path, url: data.publicUrl } satisfies UploadedAsset;
}

export function CoverAssetField({ artistId, albumId, value, onUploaded, onError }: CoverProps) {
  const inputId = useId();
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [source, setSource] = useState("");
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => () => { if (source) URL.revokeObjectURL(source); }, [source]);

  const choose = (file?: File) => {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) return onError("커버는 JPG, PNG, WebP 파일만 올릴 수 있습니다.");
    if (file.size > 10 * 1024 * 1024) return onError("커버 파일은 10MB 이하여야 합니다.");
    if (source) URL.revokeObjectURL(source);
    setSource(URL.createObjectURL(file));
    setZoom(1); setOffsetX(0); setOffsetY(0);
  };

  const saveCrop = async () => {
    const image = imageRef.current;
    if (!image) return;
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1600; canvas.height = 1600;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("이미지를 처리할 수 없습니다.");
      const size = Math.min(image.naturalWidth, image.naturalHeight) / zoom;
      const maxX = Math.max(0, (image.naturalWidth - size) / 2);
      const maxY = Math.max(0, (image.naturalHeight - size) / 2);
      const sx = Math.max(0, Math.min(image.naturalWidth - size, (image.naturalWidth - size) / 2 + (offsetX / 100) * maxX));
      const sy = Math.max(0, Math.min(image.naturalHeight - size, (image.naturalHeight - size) / 2 + (offsetY / 100) * maxY));
      context.drawImage(image, sx, sy, size, size, 0, 0, 1600, 1600);

      const sample = document.createElement("canvas");
      sample.width = 12; sample.height = 12;
      const sampleContext = sample.getContext("2d", { willReadFrequently: true });
      sampleContext?.drawImage(canvas, 0, 0, 12, 12);
      const pixels = sampleContext?.getImageData(0, 0, 12, 12).data;
      let r = 0, g = 0, b = 0, count = 0;
      if (pixels) for (let index = 0; index < pixels.length; index += 4) {
        if (pixels[index + 3] < 128) continue;
        r += pixels[index]; g += pixels[index + 1]; b += pixels[index + 2]; count += 1;
      }
      const suggested = count ? `#${hex(r / count)}${hex(g / count)}${hex(b / count)}`.toUpperCase() : "#FC6FCF";
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", .9));
      if (!blob) throw new Error("커버 변환에 실패했습니다.");
      const path = `${artistId}/${albumId}/${crypto.randomUUID()}.webp`;
      const asset = await upload("album-covers", path, blob, "image/webp");
      onUploaded(asset, suggested);
      URL.revokeObjectURL(source); setSource("");
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "커버 업로드에 실패했습니다.");
    } finally { setBusy(false); }
  };

  return <div className="music-cover-field">
    <div className="music-cover-preview">
      {value ? <img src={value} alt="앨범 커버" /> : <span>커버 없음</span>}
    </div>
    <div className="music-asset-copy">
      <b>앨범 커버</b><p>JPG, PNG, WebP · 최대 10MB · 저장 시 1600×1600 WebP</p>
      <label className="music-upload-button" htmlFor={inputId}>파일 선택</label>
      <input id={inputId} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => choose(event.target.files?.[0])} />
    </div>
    {source && <div className="music-crop-modal" role="dialog" aria-modal="true" aria-label="앨범 커버 자르기">
      <div className="music-crop-card">
        <div><p className="music-kicker">COVER CROP</p><h3>정사각형 커버 맞추기</h3></div>
        <div className="music-crop-stage"><img ref={imageRef} src={source} alt="자를 커버" style={{ transform: `translate(${offsetX * -.12}%, ${offsetY * -.12}%) scale(${zoom})` }} /></div>
        <div className="music-crop-controls">
          <label>확대 <input type="range" min="1" max="2.5" step=".01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label>
          <label>가로 위치 <input type="range" min="-100" max="100" value={offsetX} onChange={(event) => setOffsetX(Number(event.target.value))} /></label>
          <label>세로 위치 <input type="range" min="-100" max="100" value={offsetY} onChange={(event) => setOffsetY(Number(event.target.value))} /></label>
        </div>
        <div className="music-crop-actions"><button type="button" className="admin-btn admin-btn-secondary" onClick={() => { URL.revokeObjectURL(source); setSource(""); }}>취소</button><button type="button" className="admin-btn admin-btn-primary" disabled={busy} onClick={() => void saveCrop()}>{busy ? "업로드 중…" : "자르고 업로드"}</button></div>
      </div>
    </div>}
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
  kind: "audio" | "video" | "logo";
  value: string;
  onUploaded: (asset: UploadedAsset) => void;
  onClear: () => void;
  onError: (message: string) => void;
};

export function TrackAssetField({ label, hint, accept, maxBytes, artistId, albumId, trackId, kind, value, onUploaded, onClear, onError }: AssetProps) {
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const choose = async (file?: File) => {
    if (!file) return;
    const accepted = accept.split(",");
    if (!accepted.includes(file.type)) return onError(`${label} 파일 형식을 확인해 주세요.`);
    if (file.size > maxBytes) return onError(`${label} 파일 용량이 제한을 넘었습니다.`);
    setBusy(true);
    try {
      const extension = kind === "audio" ? "mp3" : kind === "video" ? "mp4" : (file.type === "image/png" ? "png" : "webp");
      const path = `${artistId}/${albumId}/${trackId}/${kind}-${crypto.randomUUID()}.${extension}`;
      onUploaded(await upload("track-assets", path, file, file.type));
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : `${label} 업로드에 실패했습니다.`);
    } finally { setBusy(false); }
  };

  return <div className={`track-asset-field ${value ? "has-file" : ""}`}>
    <span className="track-asset-icon">{kind === "audio" ? "♪" : kind === "video" ? "▶" : "◇"}</span>
    <span className="track-asset-copy"><b>{label}</b><small>{busy ? "업로드 중…" : value ? "업로드 완료" : hint}</small></span>
    {value && <a href={value} target="_blank" rel="noreferrer">보기</a>}
    <label htmlFor={inputId}>{value ? "교체" : "업로드"}</label>
    {value && <button type="button" onClick={onClear} aria-label={`${label} 제거`}>×</button>}
    <input id={inputId} className="sr-only" type="file" accept={accept} disabled={busy} onChange={(event) => void choose(event.target.files?.[0])} />
  </div>;
}
