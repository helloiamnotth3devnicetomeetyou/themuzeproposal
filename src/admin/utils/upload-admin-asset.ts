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
  if (bucket === "hero-videos") return uploadHeroVideo(file, options) as Promise<{ bucket: Bucket; path: string; url: string }>;
  const formData = new FormData();
  formData.set("bucket", bucket);
  formData.set("path", path);
  formData.set("file", file, file instanceof File ? file.name : path.split("/").pop() || "asset");
  const fileSize = file.size;
  const payload = options.onProgress
    ? await uploadWithProgress(formData, options)
    : await fetch("/api/uploads/admin-asset", { method: "POST", body: formData, signal: options.signal })
      .then(async (response) => ({
        ok: response.ok,
        status: response.status,
        payload: await response.json().catch(() => ({})),
      }));
  const body = payload.payload as {
    asset?: UploadedAsset;
    code?: string;
  };
  if (!payload.ok || !body.asset) {
    const errorCode = body.code || (payload.status === 413 ? "FILE_TOO_LARGE" : `HTTP_${payload.status}`);
    console.error("[UploadAdminAsset Error]", {
      bucket,
      path,
      fileSize,
      status: payload.status,
      code: errorCode,
      responseBody: body,
    });
    if (payload.status === 413 || errorCode === "FILE_TOO_LARGE") {
      throw new Error("파일 용량이 서버 제한을 초과했습니다 (HTTP 413 / FILE_TOO_LARGE). 20MB 이하의 영상을 선택하거나 서버/Nginx 용량 제한을 확인하세요.");
    }
    throw new Error(errorCode);
  }
  return {
    bucket,
    path: body.asset.path,
    url: body.asset.url,
  };
}

async function uploadHeroVideo(file: Blob, options: UploadOptions) {
  const contentType = "video/mp4";
  const prepared = await fetch("/api/uploads/admin-asset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "prepareHeroVideo", fileSize: file.size, contentType }),
    signal: options.signal,
  });
  const preparation = await prepared.json().catch(() => ({})) as { upload?: { url: string; path: string }; code?: string };
  if (!prepared.ok || !preparation.upload) throw new Error(preparation.code || `HTTP_${prepared.status}`);

  try {
    const uploaded = await putWithProgress(preparation.upload.url, file, contentType, options);
    if (!uploaded.ok) throw new Error(`HTTP_${uploaded.status}`);

    const completed = await fetch("/api/uploads/admin-asset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "completeHeroVideo", path: preparation.upload.path }),
      signal: options.signal,
    });
    const result = await completed.json().catch(() => ({})) as { asset?: UploadedAsset; code?: string };
    if (!completed.ok || !result.asset) throw new Error(result.code || `HTTP_${completed.status}`);
    return result.asset;
  } catch (error) {
    void fetch("/api/uploads/admin-asset", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bucket: "hero-videos", paths: [preparation.upload.path] }),
    });
    throw error;
  }
}

function putWithProgress(url: string, file: Blob, contentType: string, { signal, onProgress }: UploadOptions) {
  return new Promise<{ ok: boolean; status: number }>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.setRequestHeader("Content-Type", contentType);
    request.upload.onprogress = (event) => { if (event.lengthComputable) onProgress?.(event.loaded / event.total); };
    request.onload = () => resolve({ ok: request.status >= 200 && request.status < 300, status: request.status });
    request.onerror = () => reject(new Error("R2 직접 업로드 연결에 실패했습니다. R2 버킷 CORS에 현재 사이트 origin과 PUT/Content-Type을 허용했는지 확인하세요."));
    request.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
    signal?.addEventListener("abort", () => request.abort(), { once: true });
    request.send(file);
  });
}

function uploadWithProgress(formData: FormData, { signal, onProgress }: UploadOptions) {
  return new Promise<{ ok: boolean; status: number; payload: unknown }>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/uploads/admin-asset");
    request.responseType = "json";
    request.upload.onprogress = (event) => { if (event.lengthComputable) onProgress?.(event.loaded / event.total); };
    request.onload = () => resolve({ ok: request.status >= 200 && request.status < 300, status: request.status, payload: request.response ?? {} });
    request.onerror = () => reject(new Error("UPLOAD_FAILED"));
    request.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
    signal?.addEventListener("abort", () => request.abort(), { once: true });
    request.send(formData);
  });
}
