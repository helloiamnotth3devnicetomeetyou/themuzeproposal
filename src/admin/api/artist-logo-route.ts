import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/core/auth/require-admin";
import { isSameOriginRequest } from "@/core/http/same-origin";
import { parseFormDataWithinLimit } from "@/core/http/request-body";
import { consumeAdminUploadAttemptRateLimit } from "@/core/http/submission-rate-limit";
import { getPublicAssetUrl } from "@/core/storage/public-url";
import { deleteObjects, uploadObject } from "@/core/storage/r2";
import { createServiceRoleClient } from "@/core/uploads/service-storage";
import {
  sanitizeSvg,
  trimSvgToContent,
  UnsafeSvgError,
} from "@/core/utils/svg-sanitizer";

const MAX_SVG_BYTES = 10 * 1024 * 1024;

function safePathPart(value: FormDataEntryValue | null, fallback: string) {
  const normalized =
    typeof value === "string"
      ? value
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, "-")
          .replace(/^-|-$/g, "")
      : "";
  return normalized || fallback;
}

function errorResponse(code: string, status: number) {
  const response = NextResponse.json({ code }, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request))
    return errorResponse("INVALID_REQUEST", 400);

  const auth = await requireAdmin();
  if (auth.denied) return errorResponse(auth.denied.code, auth.denied.status);
  const { user } = auth;
  const attempt = await consumeAdminUploadAttemptRateLimit(request, user.id);
  if (attempt.error) return errorResponse("SERVICE_UNAVAILABLE", 503);
  if (!attempt.allowed) return errorResponse("RATE_LIMITED", 429);

  let formData: FormData;
  try {
    const parsed = await parseFormDataWithinLimit(
      request,
      MAX_SVG_BYTES + 64 * 1024,
    );
    if (!parsed) return errorResponse("FILE_TOO_LARGE", 413);
    formData = parsed;
  } catch {
    return errorResponse("INVALID_FILE", 400);
  }

  const file = formData.get("file");
  if (
    !(file instanceof File) ||
    file.size < 1 ||
    file.size > MAX_SVG_BYTES ||
    !file.name.toLowerCase().endsWith(".svg") ||
    !["image/svg+xml", "text/xml", "application/xml", ""].includes(file.type)
  ) {
    return errorResponse("INVALID_FILE", 400);
  }

  const textContent = await file.text();
  const trimmedText = textContent.replace(/^\uFEFF/, "").trim();
  const isValidSvgStart =
    trimmedText.startsWith("<svg") ||
    trimmedText.startsWith("<?xml") ||
    trimmedText.startsWith("<!--") ||
    trimmedText.startsWith("<!DOCTYPE");

  if (!isValidSvgStart) {
    return errorResponse("INVALID_FILE", 400);
  }

  let sanitized: string;
  try {
    sanitized = sanitizeSvg(textContent);
    if (formData.get("assetKind") === "album-typography") {
      sanitized = await trimSvgToContent(sanitized);
    }
  } catch (error) {
    if (error instanceof UnsafeSvgError)
      return errorResponse("UNSAFE_SVG", 400);
    return errorResponse("INVALID_FILE", 400);
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) return errorResponse("SERVICE_UNAVAILABLE", 503);
  const artistKey = safePathPart(formData.get("artistKey"), "draft");
  const entityKey = safePathPart(formData.get("entityKey"), "asset");
  const assetFolder =
    formData.get("assetKind") === "album-typography"
      ? "album-typography-sanitized"
      : "artist-logo-sanitized";
  const path = `${artistKey}/${assetFolder}/${entityKey}/${crypto.randomUUID()}.svg`;
  const { error: uploadError } = await uploadObject({
    bucket: "artist-assets",
    path,
    body: new Blob([sanitized], { type: "image/svg+xml" }),
    contentType: "image/svg+xml",
    cacheControl: "public, max-age=31536000, immutable",
  });

  if (uploadError) return errorResponse("UPLOAD_FAILED", 503);

  const { error: auditError } = await adminClient
    .from("admin_audit_logs")
    .insert({
      actor_id: user.id,
      actor_email: user.email ?? null,
      operation: "INSERT",
      table_name: "storage.objects",
      record_id: `artist-assets/${path}`,
      record_label: `Artist logo: ${path}`,
      changed_fields: ["name", "metadata"],
      after_values: {
        bucket: "artist-assets",
        path,
        mime_type: "image/svg+xml",
        size: sanitized.length,
      },
    });
  if (auditError) {
    await deleteObjects("artist-assets", [path]);
    return errorResponse("AUDIT_FAILED", 503);
  }

  const response = NextResponse.json({
    asset: {
      bucket: "artist-assets",
      path,
      url: getPublicAssetUrl("artist-assets", path),
    },
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
