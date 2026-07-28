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

export const runtime = "nodejs";

const BUCKETS = {
  "artist-assets": { maxBytes: 30 * 1024 * 1024, profile: "public-image" },
  "album-covers": { maxBytes: 30 * 1024 * 1024, profile: "public-image" },
  "track-assets": { maxBytes: 100 * 1024 * 1024, profile: "track-asset" },
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
  const config = BUCKETS[bucket as keyof typeof BUCKETS];
  if (!config || !isSafeStoragePath(requestedPath) || !(file instanceof File)) {
    return errorResponse("INVALID_FILE", 400);
  }
  if (file.size < 1 || file.size > config.maxBytes) {
    return errorResponse(file.size > config.maxBytes ? "FILE_TOO_LARGE" : "INVALID_FILE", file.size > config.maxBytes ? 413 : 400);
  }

  const validated = await validateFileSignature(file, config.profile);
  if (!validated) return errorResponse("INVALID_FILE_TYPE", 400);

  const path = replacePathExtension(requestedPath, validated.extension);
  if (!extensionMatches(path, validated.extension)) return errorResponse("INVALID_FILE_TYPE", 400);

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) return errorResponse("SERVICE_UNAVAILABLE", 503);

  const { error: uploadError } = await serviceClient.storage
    .from(bucket)
    .upload(path, file, {
      contentType: validated.mimeType,
      upsert: formData.get("upsert") === "true",
    });
  if (uploadError) return errorResponse("UPLOAD_FAILED", 503);

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
