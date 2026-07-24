"use client";

/* eslint-disable @next/next/no-img-element */
import { useId, useState } from "react";
import { LuPlus } from "react-icons/lu";
import { supabase } from "@/lib/supabase";

export type UploadedImageAsset = {
  bucket: "artist-assets";
  path: string;
  url: string;
};

type ImageAssetFieldProps = {
  label: string;
  hint: string;
  value: string;
  artistKey: string;
  entityKey: string;
  kind: "artist-profile" | "artist-logo" | "member-profile";
  shape?: "square" | "portrait" | "logo";
  required?: boolean;
  onChange: (url: string) => void | Promise<void>;
  onUploaded?: (asset: UploadedImageAsset) => void;
  onError: (message: string) => void;
};

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const safePathPart = (value: string, fallback: string) => {
  const safe = value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  return safe || fallback;
};

export default function ImageAssetField({
  label,
  hint,
  value,
  artistKey,
  entityKey,
  kind,
  shape = "square",
  required = false,
  onChange,
  onUploaded,
  onError,
}: ImageAssetFieldProps) {
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const maxBytes = kind === "artist-logo" ? 10 * 1024 * 1024 : 30 * 1024 * 1024;
  const maxMegabytes = maxBytes / 1024 / 1024;

  const uploadFile = async (file?: File) => {
    if (!file) return;
    const fileType = file.type;
    if (!IMAGE_TYPES.includes(fileType)) {
      onError(`${label}은 JPG, PNG, WebP 파일만 올릴 수 있습니다.`);
      return;
    }
    if (file.size > maxBytes) {
      onError(`${label} 파일은 ${maxMegabytes}MB 이하여야 합니다.`);
      return;
    }
    setBusy(true);
    try {
      const extension = fileType === "image/png" ? "png" : fileType === "image/webp" ? "webp" : "jpg";
      const path = `${safePathPart(artistKey, "draft")}/${kind}/${safePathPart(entityKey, "asset")}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from("artist-assets").upload(path, file, { contentType: fileType, upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("artist-assets").getPublicUrl(path);
      const asset: UploadedImageAsset = { bucket: "artist-assets", path, url: data.publicUrl };
      await onChange(asset.url);
      onUploaded?.(asset);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : `${label} 업로드에 실패했습니다.`;
      onError(message.includes("Bucket not found") ? "아티스트 자산 버킷이 없습니다. 004_artist_assets.sql을 먼저 적용하세요." : message);
    } finally {
      setBusy(false);
      setDragging(false);
    }
  };

  return (
    <div className={`content-asset-field is-${shape} ${dragging ? "is-dragging" : ""} ${value ? "has-value" : ""}`}>
      <div className="content-asset-preview">
        {value ? <img src={value} alt={`${label} 미리보기`} className={kind === "artist-logo" && /\.svg(?:$|\?)/i.test(value) ? "is-theme-svg" : undefined} /> : <div><span>{kind === "artist-logo" ? "LOGO" : "IMAGE"}</span><b><LuPlus aria-hidden="true" /></b></div>}
      </div>
      <div
        className="content-asset-dropzone"
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
        onDrop={(event) => { event.preventDefault(); setDragging(false); void uploadFile(event.dataTransfer.files?.[0]); }}
      >
        <div className="content-asset-copy">
          <span>{label}{required && <b>*</b>}</span>
          <p>{busy ? "업로드 중…" : hint}</p>
          <small>JPG, PNG, WebP · 최대 {maxMegabytes}MB</small>
        </div>
        <div className="content-asset-actions">
          <label htmlFor={inputId}>{busy ? "업로드 중" : value ? "파일 교체" : "파일 선택"}</label>
          {value && <button type="button" onClick={() => void onChange("")} disabled={busy}>제거</button>}
        </div>
        <input
          id={inputId}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={(event) => { void uploadFile(event.target.files?.[0]); event.currentTarget.value = ""; }}
        />
      </div>
    </div>
  );
}
