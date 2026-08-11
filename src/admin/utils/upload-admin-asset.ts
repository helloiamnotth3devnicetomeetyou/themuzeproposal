import type { UploadedAsset } from "@/core/utils/music-editor";
import { createGuideSandboxAsset, isGuideSandboxActive } from "@/core/supabase/guide-sandbox";

type AdminAssetBucket = UploadedAsset["bucket"];

type UploadOptions = {
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
};

export async function uploadAdminAsset<Bucket extends AdminAssetBucket>(
  bucket: Bucket,
  path: string,
  file: Blob,
  options: UploadOptions = {},
): Promise<{ bucket: Bucket; path: string; url: string }> {
  if (isGuideSandboxActive()) return createGuideSandboxAsset(file, bucket, path);
  const formData = new FormData();
  formData.set("bucket", bucket);
  formData.set("path", path);
  formData.set("file", file, file instanceof File ? file.name : path.split("/").pop() || "asset");
  const payload = options.onProgress
    ? await uploadWithProgress(formData, options)
    : await fetch("/api/uploads/admin-asset", { method: "POST", body: formData, signal: options.signal })
      .then(async (response) => ({ ok: response.ok, payload: await response.json().catch(() => ({})) }));
  const body = payload.payload as {
    asset?: UploadedAsset;
    code?: string;
  };
  if (!payload.ok || !body.asset) throw new Error(body.code || "UPLOAD_FAILED");
  return {
    bucket,
    path: body.asset.path,
    url: body.asset.url,
  };
}

function uploadWithProgress(formData: FormData, { signal, onProgress }: UploadOptions) {
  return new Promise<{ ok: boolean; payload: unknown }>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/uploads/admin-asset");
    request.responseType = "json";
    request.upload.onprogress = (event) => { if (event.lengthComputable) onProgress?.(event.loaded / event.total); };
    request.onload = () => resolve({ ok: request.status >= 200 && request.status < 300, payload: request.response ?? {} });
    request.onerror = () => reject(new Error("UPLOAD_FAILED"));
    request.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
    signal?.addEventListener("abort", () => request.abort(), { once: true });
    request.send(formData);
  });
}
