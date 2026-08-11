import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/core/auth/admin-auth";
import { getPublicSupabaseConfig } from "@/core/config/public-env";
import { parseFormDataWithinLimit } from "@/core/http/request-body";
import { isSameOriginRequest } from "@/core/http/same-origin";
import { consumeAdminUploadAttemptRateLimit } from "@/core/http/submission-rate-limit";
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

function errorResponse(code: string, status: number) {
  const response = NextResponse.json({ code }, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return errorResponse("INVALID_REQUEST", 400);

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return errorResponse("UNAUTHORIZED", 401);
  if (!(await isAdmin(supabase, user.id))) return errorResponse("FORBIDDEN", 403);
  const attempt = await consumeAdminUploadAttemptRateLimit(request, user.id);
  if (attempt.error) return errorResponse("SERVICE_UNAVAILABLE", 503);
  if (!attempt.allowed) return errorResponse("RATE_LIMITED", 429);

  let formData: FormData;
  try {
    const parsed = await parseFormDataWithinLimit(request, 100 * 1024 * 1024 + 64 * 1024);
    if (!parsed) return errorResponse("FILE_TOO_LARGE", 413);
    formData = parsed;
  } catch {
    return errorResponse("INVALID_FILE", 400);
  }

  const bucket = String(formData.get("bucket") || "");
  const requestedPath = String(formData.get("path") || "");
  const file = formData.get("file");
  const config = BUCKETS[bucket as keyof typeof BUCKETS];
  if (!config || !isSafeStoragePath(requestedPath) || !(file instanceof File)) {
    return errorResponse("INVALID_FILE", 400);
  }
  const fileSize = file.size;
  if (!Number.isSafeInteger(fileSize) || fileSize < 1 || fileSize > config.maxBytes) {
    return errorResponse(fileSize > config.maxBytes ? "FILE_TOO_LARGE" : "INVALID_FILE", fileSize > config.maxBytes ? 413 : 400);
  }

  const validated = await validateFileSignature(file, config.profile);
  if (!validated) return errorResponse("INVALID_FILE_TYPE", 400);

  let path = replacePathExtension(requestedPath, validated.extension);
  if (!extensionMatches(path, validated.extension)) return errorResponse("INVALID_FILE_TYPE", 400);
  if (bucket === "business-assets") {
    if (path === "press-kit.zip" && validated.extension === "zip") path = `press-kit/${crypto.randomUUID()}.zip`;
    else if (path === "profile.pdf" && validated.extension === "pdf") path = `profile/${crypto.randomUUID()}.pdf`;
    else return errorResponse("INVALID_FILE", 400);
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) return errorResponse("SERVICE_UNAVAILABLE", 503);

  const { error } = await serviceClient.storage.from(bucket).upload(path, file, {
    contentType: validated.mimeType,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) return errorResponse("UPLOAD_FAILED", 503);

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
    await serviceClient.storage.from(bucket).remove([path]);
    return errorResponse("AUDIT_FAILED", 503);
  }

  const { storageUrl } = getPublicSupabaseConfig();
  const response = NextResponse.json({
    asset: {
      bucket,
      path,
      url: `${storageUrl}/${bucket}/${path}`,
    },
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
