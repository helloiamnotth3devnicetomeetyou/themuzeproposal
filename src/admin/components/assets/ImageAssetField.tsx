"use client";

import { useId, useState } from "react";
import { toWebP } from "@/admin/utils/image-convert";
import { uploadAdminAsset } from "@/admin/utils/upload-admin-asset";
import { Plus } from "lucide-react";
import AdminAssetImage from "./AdminAssetImage";
import { guideSandboxFetch } from "@/core/supabase/guide-sandbox";

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
    const isSvg = kind === "artist-logo" && file.name.toLowerCase().endsWith(".svg");
    if (!IMAGE_TYPES.includes(fileType) && !isSvg) {
      onError(`${label}은 ${kind === "artist-logo" ? "JPG, PNG, WebP, SVG" : "JPG, PNG, WebP"} 파일만 올릴 수 있습니다.`);
      return;
    }
    if (file.size > maxBytes) {
      onError(`${label} 파일은 ${maxMegabytes}MB 이하여야 합니다.`);
      return;
    }
    setBusy(true);
    try {
      let asset: UploadedImageAsset;
      if (isSvg) {
        const formData = new FormData();
        formData.set("file", file);
        formData.set("artistKey", artistKey);
        formData.set("entityKey", entityKey);
        const response = await guideSandboxFetch("/api/uploads/artist-logo", {
          method: "POST",
          body: formData,
        });
        const payload = await response.json().catch(() => ({})) as {
          asset?: UploadedImageAsset;
          code?: string;
        };
        if (!response.ok || !payload.asset) throw new Error(payload.code || "UPLOAD_FAILED");
        asset = payload.asset;
      } else {
        const converted = await toWebP(file);
        const path = `${safePathPart(artistKey, "draft")}/${kind}/${safePathPart(entityKey, "asset")}/${crypto.randomUUID()}.webp`;
        asset = await uploadAdminAsset("artist-assets", path, converted);
      }
      await onChange(asset.url);
      onUploaded?.(asset);
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : "UPLOAD_FAILED";
      onError(code === "UNSAFE_SVG"
        ? "스크립트, 외부 리소스 또는 허용되지 않은 SVG 요소가 포함되어 있습니다."
        : `${label} 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.`);
    } finally {
      setBusy(false);
      setDragging(false);
    }
  };

  return (
    <div className={`content-asset-field is-${shape} ${dragging ? "is-dragging" : ""} ${value ? "has-value" : ""}`}>
      <div className="content-asset-preview">
        {value ? <AdminAssetImage src={value} alt={`${label} 미리보기`} sizes="320px" className={kind === "artist-logo" && /\.svg(?:$|\?)/i.test(value) ? "is-theme-svg" : undefined} /> : <div><span>{kind === "artist-logo" ? "LOGO" : "IMAGE"}</span><b><Plus aria-hidden="true" /></b></div>}
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
          <small>{kind === "artist-logo" ? "JPG, PNG, WebP, SVG" : "JPG, PNG, WebP"} · 최대 {maxMegabytes}MB</small>
        </div>
        <div className="content-asset-actions">
          <label htmlFor={inputId}>{busy ? "업로드 중" : value ? "파일 교체" : "파일 선택"}</label>
          {value && <button type="button" onClick={() => void onChange("")} disabled={busy}>제거</button>}
        </div>
        <input
          id={inputId}
          className="sr-only"
          type="file"
          accept={kind === "artist-logo" ? "image/jpeg,image/png,image/webp,image/svg+xml,.svg" : "image/jpeg,image/png,image/webp"}
          disabled={busy}
          onChange={(event) => { void uploadFile(event.target.files?.[0]); event.currentTarget.value = ""; }}
        />
      </div>
    </div>
  );
}
