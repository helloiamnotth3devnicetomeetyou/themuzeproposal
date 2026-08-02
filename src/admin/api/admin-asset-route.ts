import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/core/auth/admin-auth";
import { getPublicSupabaseConfig } from "@/core/config/public-env";
import { isSameOriginRequest } from "@/core/http/same-origin";
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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("INVALID_FILE", 400);
  }

  const bucket = String(formData.get("bucket") || "");
  const requestedPath = String(formData.get("path") || "");
  const file = formData.get("file");
  const direct = formData.get("direct") === "true";
  const config = BUCKETS[bucket as keyof typeof BUCKETS];
  if (!config || !isSafeStoragePath(requestedPath) || !(file instanceof File)) {
    return errorResponse("INVALID_FILE", 400);
  }
  const fileSize = direct ? Number(formData.get("size")) : file.size;
  if (!Number.isSafeInteger(fileSize) || fileSize < 1 || fileSize > config.maxBytes) {
    return errorResponse(fileSize > config.maxBytes ? "FILE_TOO_LARGE" : "INVALID_FILE", fileSize > config.maxBytes ? 413 : 400);
  }

  const validated = await validateFileSignature(file, config.profile);
  if (!validated) return errorResponse("INVALID_FILE_TYPE", 400);

  const path = replacePathExtension(requestedPath, validated.extension);
  if (!extensionMatches(path, validated.extension)) return errorResponse("INVALID_FILE_TYPE", 400);
  if (direct && (bucket !== "track-assets" || validated.mimeType !== "audio/mpeg")) {
    return errorResponse("INVALID_FILE", 400);
  }
  if (bucket === "business-assets" && !["press-kit.zip", "profile.pdf"].includes(path)) {
    return errorResponse("INVALID_FILE", 400);
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) return errorResponse("SERVICE_UNAVAILABLE", 503);

  let token: string | undefined;
  if (direct) {
    const { data, error } = await serviceClient.storage.from(bucket).createSignedUploadUrl(path, {
      upsert: formData.get("upsert") === "true",
    });
    if (error || !data) return errorResponse("UPLOAD_FAILED", 503);
    token = data.token;
  } else {
    const { error } = await serviceClient.storage.from(bucket).upload(path, file, {
      contentType: validated.mimeType,
      upsert: formData.get("upsert") === "true",
    });
    if (error) return errorResponse("UPLOAD_FAILED", 503);
  }

  await serviceClient.from("admin_audit_logs").insert({
    actor_id: user.id,
    actor_email: user.email ?? null,
    operation: "UPDATE",
    table_name: "storage.objects",
    record_id: `${bucket}/${path}`,
    record_label: `Business asset: ${path}`,
    changed_fields: ["name", "metadata"],
    after_values: { bucket, path, mime_type: validated.mimeType, size: fileSize },
  });

  const { storageUrl } = getPublicSupabaseConfig();
  const response = NextResponse.json({
    token,
    asset: {
      bucket,
      path,
      url: `${storageUrl}/${bucket}/${path}`,
    },
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
