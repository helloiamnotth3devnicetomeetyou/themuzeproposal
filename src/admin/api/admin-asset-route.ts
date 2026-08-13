import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/core/auth/admin-auth";
import { parseFormDataWithinLimit, parseJsonWithinLimit } from "@/core/http/request-body";
import { isSameOriginRequest } from "@/core/http/same-origin";
import { consumeAdminUploadAttemptRateLimit } from "@/core/http/submission-rate-limit";
import { getPublicAssetUrl } from "@/core/storage/public-url";
import { createSignedUploadUrl, deleteObjects, getObjectForValidation, uploadObject } from "@/core/storage/r2";
import { createSupabaseServerClient } from "@/core/supabase/server";
import {
  extensionMatches,
  validateFileSignature,
  type FileValidationProfile,
} from "@/core/uploads/file-signature";
import {
  createServiceRoleClient,
  isSafeStoragePath,
  replacePathExtension,
} from "@/core/uploads/service-storage";

const BUCKETS = {
  "artist-assets": { maxBytes: 30 * 1024 * 1024, profile: "public-image" },
  "album-covers": { maxBytes: 30 * 1024 * 1024, profile: "public-image" },
  "track-assets": { maxBytes: 100 * 1024 * 1024, profile: "track-asset" },
  "business-assets": { maxBytes: 100 * 1024 * 1024, profile: "business-asset" },
  "hero-videos": { maxBytes: 20 * 1024 * 1024, profile: "hero-video" },
} as const satisfies Record<string, { maxBytes: number; profile: FileValidationProfile }>;
const MAX_DELETE_BODY_BYTES = 64 * 1024;
const HERO_VIDEO_BUCKET = "hero-videos";
const HERO_VIDEO_MAX_BYTES = BUCKETS[HERO_VIDEO_BUCKET].maxBytes;
const DELETABLE_BUCKETS = new Set([...Object.keys(BUCKETS), "audition-attachments"]);

function errorResponse(code: string, status: number, details?: Record<string, unknown>) {
  console.error(`[AdminAssetUpload] Error HTTP ${status} code=${code}`, details ? JSON.stringify(details) : "");
  const response = NextResponse.json({ code }, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return errorResponse("INVALID_REQUEST", 400, { reason: "invalid_origin", origin: request.headers.get("origin") });

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return errorResponse("UNAUTHORIZED", 401, { reason: "user_auth_failed", userError: userError?.message });
  if (!(await isAdmin(supabase, user.id))) return errorResponse("FORBIDDEN", 403, { reason: "not_admin", userId: user.id });
  const attempt = await consumeAdminUploadAttemptRateLimit(request, user.id);
  if (attempt.error) return errorResponse("SERVICE_UNAVAILABLE", 503, { reason: "rate_limit_check_error" });
  if (!attempt.allowed) return errorResponse("RATE_LIMITED", 429, { userId: user.id });

  if (request.headers.get("content-type")?.startsWith("application/json")) {
    const body = await parseJsonWithinLimit(request, MAX_DELETE_BODY_BYTES).catch(() => null) as {
      action?: unknown;
      fileSize?: unknown;
      contentType?: unknown;
      path?: unknown;
    } | null;
    if (body?.action === "prepareHeroVideo") {
      if (body.contentType !== "video/mp4" || !Number.isSafeInteger(body.fileSize) || Number(body.fileSize) < 1 || Number(body.fileSize) > HERO_VIDEO_MAX_BYTES) {
        return errorResponse(Number(body?.fileSize) > HERO_VIDEO_MAX_BYTES ? "FILE_TOO_LARGE" : "INVALID_FILE", Number(body?.fileSize) > HERO_VIDEO_MAX_BYTES ? 413 : 400);
      }
      const path = `pending/${crypto.randomUUID()}.mp4`;
      const uploadUrl = await createSignedUploadUrl(HERO_VIDEO_BUCKET, path, "video/mp4", Number(body.fileSize));
      if (!uploadUrl) return errorResponse("SERVICE_UNAVAILABLE", 503, { reason: "signed_upload_url_failed" });
      return NextResponse.json({ upload: { url: uploadUrl, path } }, { headers: { "Cache-Control": "no-store" } });
    }
    if (body?.action === "completeHeroVideo") {
      const path = typeof body.path === "string" ? body.path : "";
      if (!/^pending\/[0-9a-f-]{36}\.mp4$/i.test(path) || !isSafeStoragePath(path)) return errorResponse("INVALID_FILE", 400);
      const source = await getObjectForValidation(HERO_VIDEO_BUCKET, path, HERO_VIDEO_MAX_BYTES);
      if (!source || "tooLarge" in source || source.body.byteLength < 1 || source.contentType !== "video/mp4") {
        await deleteObjects(HERO_VIDEO_BUCKET, [path]);
        return errorResponse(source && "tooLarge" in source ? "FILE_TOO_LARGE" : "INVALID_FILE", source && "tooLarge" in source ? 413 : 400);
      }
      const file = new File([new Uint8Array(source.body).buffer], "hero.mp4", { type: source.contentType });
      if (!(await validateFileSignature(file, "hero-video"))) {
        await deleteObjects(HERO_VIDEO_BUCKET, [path]);
        return errorResponse("INVALID_FILE_TYPE", 400);
      }
      const finalPath = path.replace(/^pending\//, "clips/");
      const { error } = await uploadObject({ bucket: HERO_VIDEO_BUCKET, path: finalPath, body: source.body, contentType: "video/mp4", cacheControl: "public, max-age=31536000, immutable" });
      if (error) {
        await deleteObjects(HERO_VIDEO_BUCKET, [path, finalPath]);
        return errorResponse("UPLOAD_FAILED", 503);
      }
      const serviceClient = createServiceRoleClient();
      if (!serviceClient) {
        await deleteObjects(HERO_VIDEO_BUCKET, [path, finalPath]);
        return errorResponse("SERVICE_UNAVAILABLE", 503);
      }
      const { error: auditError } = await serviceClient.from("admin_audit_logs").insert({
        actor_id: user.id,
        actor_email: user.email ?? null,
        operation: "UPDATE",
        table_name: "storage.objects",
        record_id: `${HERO_VIDEO_BUCKET}/${finalPath}`,
        record_label: `Hero video: ${finalPath}`,
        changed_fields: ["name", "metadata"],
        after_values: { bucket: HERO_VIDEO_BUCKET, path: finalPath, mime_type: "video/mp4", size: source.body.byteLength },
      });
      if (auditError) {
        await deleteObjects(HERO_VIDEO_BUCKET, [path, finalPath]);
        return errorResponse("AUDIT_FAILED", 503);
      }
      await deleteObjects(HERO_VIDEO_BUCKET, [path]);
      return NextResponse.json({ asset: { bucket: HERO_VIDEO_BUCKET, path: finalPath, url: getPublicAssetUrl(HERO_VIDEO_BUCKET, finalPath) } }, { headers: { "Cache-Control": "no-store" } });
    }
    return errorResponse("INVALID_FILE", 400);
  }

  let formData: FormData;
  try {
    const parsed = await parseFormDataWithinLimit(request, 100 * 1024 * 1024 + 64 * 1024, 3 * 60 * 1000);
    if (!parsed) return errorResponse("FILE_TOO_LARGE", 413, { reason: "body_size_exceeded_stream_limit", limit: "100MB+64KB" });
    formData = parsed;
  } catch (error) {
    return errorResponse("INVALID_FILE", 400, { reason: "parse_form_data_failed", error: error instanceof Error ? error.message : String(error) });
  }

  const bucket = String(formData.get("bucket") || "");
  const requestedPath = String(formData.get("path") || "");
  const file = formData.get("file");
  const config = BUCKETS[bucket as keyof typeof BUCKETS];
  if (!config || !isSafeStoragePath(requestedPath) || !(file instanceof File)) {
    return errorResponse("INVALID_FILE", 400, { reason: "invalid_params", bucket, requestedPath, isFile: file instanceof File });
  }
  const fileSize = file.size;
  if (!Number.isSafeInteger(fileSize) || fileSize < 1 || fileSize > config.maxBytes) {
    const isTooLarge = fileSize > config.maxBytes;
    return errorResponse(
      isTooLarge ? "FILE_TOO_LARGE" : "INVALID_FILE",
      isTooLarge ? 413 : 400,
      { reason: isTooLarge ? "file_size_exceeds_bucket_limit" : "invalid_file_size", bucket, fileSize, maxBytes: config.maxBytes }
    );
  }

  const validated = await validateFileSignature(file, config.profile);
  if (!validated) return errorResponse("INVALID_FILE_TYPE", 400, { reason: "file_signature_mismatch", bucket, fileName: file.name, fileSize });

  let path = replacePathExtension(requestedPath, validated.extension);
  if (!extensionMatches(path, validated.extension)) return errorResponse("INVALID_FILE_TYPE", 400, { reason: "extension_mismatch", path, extension: validated.extension });
  if (bucket === "business-assets") {
    if (path === "press-kit.zip" && validated.extension === "zip") path = `press-kit/${crypto.randomUUID()}.zip`;
    else if (path === "profile.pdf" && validated.extension === "pdf") path = `profile/${crypto.randomUUID()}.pdf`;
    else return errorResponse("INVALID_FILE", 400, { reason: "invalid_business_asset_path", path, extension: validated.extension });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) return errorResponse("SERVICE_UNAVAILABLE", 503, { reason: "service_role_client_missing" });

  const { error } = await uploadObject({
    bucket,
    path,
    body: file,
    contentType: validated.mimeType,
    cacheControl: "public, max-age=31536000, immutable",
  });
  if (error) return errorResponse("UPLOAD_FAILED", 503, { reason: "r2_upload_failed", bucket, path });

  const { error: auditError } = await serviceClient.from("admin_audit_logs").insert({
    actor_id: user.id,
    actor_email: user.email ?? null,
    operation: "UPDATE",
    table_name: "storage.objects",
    record_id: `${bucket}/${path}`,
    record_label: `Business asset: ${path}`,
    changed_fields: ["name", "metadata"],
    after_values: { bucket, path, mime_type: validated.mimeType, size: fileSize },
  });
  if (auditError) {
    await deleteObjects(bucket, [path]);
    return errorResponse("AUDIT_FAILED", 503, { reason: "audit_log_insert_failed", bucket, path, auditError: auditError.message });
  }

  const response = NextResponse.json({
    asset: {
      bucket,
      path,
      url: getPublicAssetUrl(bucket, path),
    },
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) return errorResponse("INVALID_REQUEST", 400);
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return errorResponse("UNAUTHORIZED", 401);
  if (!(await isAdmin(supabase, user.id))) return errorResponse("FORBIDDEN", 403);
  const body = await parseJsonWithinLimit(request, MAX_DELETE_BODY_BYTES).catch(() => null) as { bucket?: unknown; paths?: unknown } | null;
  const bucket = typeof body?.bucket === "string" ? body.bucket : "";
  const paths = Array.isArray(body?.paths) && body.paths.length <= 100 && body.paths.every((path): path is string => typeof path === "string" && isSafeStoragePath(path))
    ? [...new Set(body.paths)] : [];
  if (!DELETABLE_BUCKETS.has(bucket) || !paths.length) return errorResponse("INVALID_FILE", 400);
  const { error } = await deleteObjects(bucket, paths);
  if (error) return errorResponse("DELETE_FAILED", 503);
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
