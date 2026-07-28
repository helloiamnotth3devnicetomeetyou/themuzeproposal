import type { UploadedAsset } from "@/core/utils/music-editor";

type AdminAssetBucket = UploadedAsset["bucket"];

export async function uploadAdminAsset<Bucket extends AdminAssetBucket>(
  bucket: Bucket,
  path: string,
  file: Blob,
  options: { upsert?: boolean } = {},
): Promise<{ bucket: Bucket; path: string; url: string }> {
  const formData = new FormData();
  formData.set("bucket", bucket);
  formData.set("path", path);
  formData.set("file", file, file instanceof File ? file.name : path.split("/").pop() || "asset");
  if (options.upsert) formData.set("upsert", "true");

  const response = await fetch("/api/uploads/admin-asset", {
    method: "POST",
    body: formData,
  });
  const payload = await response.json().catch(() => ({})) as {
    asset?: UploadedAsset;
    code?: string;
  };
  if (!response.ok || !payload.asset) throw new Error(payload.code || "UPLOAD_FAILED");
  return {
    bucket,
    path: payload.asset.path,
    url: payload.asset.url,
  };
}
