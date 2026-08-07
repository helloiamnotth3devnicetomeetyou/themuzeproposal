import type { UploadedAsset } from "@/core/utils/music-editor";
import { supabase } from "@/core/supabase/client";
import { createGuideSandboxAsset, isGuideSandboxActive } from "@/core/supabase/guide-sandbox";

type AdminAssetBucket = UploadedAsset["bucket"];

export async function uploadAdminAsset<Bucket extends AdminAssetBucket>(
  bucket: Bucket,
  path: string,
  file: Blob,
  options: { upsert?: boolean } = {},
): Promise<{ bucket: Bucket; path: string; url: string }> {
  if (isGuideSandboxActive()) return createGuideSandboxAsset(file, bucket, path);
  const formData = new FormData();
  formData.set("bucket", bucket);
  formData.set("path", path);
  const direct = bucket === "track-assets" && path.toLowerCase().endsWith(".mp3");
  formData.set("file", direct ? file.slice(0, 4096) : file, file instanceof File ? file.name : path.split("/").pop() || "asset");
  if (direct) {
    formData.set("direct", "true");
    formData.set("size", String(file.size));
  }
  if (options.upsert) formData.set("upsert", "true");

  const response = await fetch("/api/uploads/admin-asset", {
    method: "POST",
    body: formData,
  });
  const payload = await response.json().catch(() => ({})) as {
    asset?: UploadedAsset;
    code?: string;
    token?: string;
  };
  if (!response.ok || !payload.asset) throw new Error(payload.code || "UPLOAD_FAILED");
  if (direct) {
    if (!payload.token) throw new Error("UPLOAD_FAILED");
    const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(
      payload.asset.path,
      payload.token,
      file.slice(0, file.size, "audio/mpeg"),
    );
    if (error) throw new Error("UPLOAD_FAILED");
  }
  return {
    bucket,
    path: payload.asset.path,
    url: payload.asset.url,
  };
}
