import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/core/auth/admin-auth";
import {
  parseFormDataWithinLimit,
  parseJsonWithinLimit,
} from "@/core/http/request-body";
import { isSameOriginRequest } from "@/core/http/same-origin";
import { consumeAdminUploadAttemptRateLimit } from "@/core/http/submission-rate-limit";
import { getPublicAssetUrl } from "@/core/storage/public-url";
import {
  createSignedUploadUrl,
  deleteObjects,
  getObjectForValidation,
  uploadObject,
} from "@/core/storage/r2";
import { createSupabaseServerClient } from "@/core/supabase/server";
import {
  validateFileSignature,
  type FileValidationProfile,
} from "@/core/uploads/file-signature";
import {
  createServiceRoleClient,
  isSafeStoragePath,
} from "@/core/uploads/service-storage";

const BUCKETS = {
  "artist-assets": { maxBytes: 30 * 1024 * 1024, profile: "public-image" },
  "album-covers": { maxBytes: 30 * 1024 * 1024, profile: "public-image" },
  "track-assets": { maxBytes: 100 * 1024 * 1024, profile: "track-asset" },
  "business-assets": { maxBytes: 100 * 1024 * 1024, profile: "business-asset" },
  "hero-videos": { maxBytes: 20 * 1024 * 1024, profile: "hero-video" },
} as const satisfies Record<
  string,
  { maxBytes: number; profile: FileValidationProfile }
>;
const MAX_DELETE_BODY_BYTES = 64 * 1024;
const HERO_VIDEO_BUCKET = "hero-videos";
const HERO_VIDEO_MAX_BYTES = BUCKETS[HERO_VIDEO_BUCKET].maxBytes;
const ADMIN_DELETE_BUCKETS = new Set([
  ...Object.keys(BUCKETS),
  "audition-attachments",
]);
const AVATAR_PATH =
  /^([0-9a-f-]{36})\/avatars\/[0-9a-f-]{36}\.(?:jpg|png|webp|gif)$/i;
const UUID_PATH =
  "[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const AUDITION_ATTACHMENT_PATH = new RegExp(
  `^${UUID_PATH}\/${UUID_PATH}\/${UUID_PATH}\/${UUID_PATH}\\.[a-z0-9]+$`,
  "i",
);

const PUBLIC_ASSET_URL_REFERENCES = {
  "artist-assets": [
    ["artists", ["logo_url", "image_url"]],
    ["albums", ["cover_url", "hero_image_url", "typo_logo_url"]],
    ["artist_gallery", ["image_url"]],
    ["artist_members", ["image_url"]],
    ["artist_scenes", ["image_url"]],
    ["artist_scene_members", ["mask_url"]],
    ["tracks", ["audio_url", "music_video_url", "logo_url"]],
    ["home_hero_slides", ["video_url"]],
  ],
  "album-covers": [["albums", ["cover_url"]]],
  "track-assets": [["tracks", ["audio_url", "music_video_url", "logo_url"]]],
  "hero-videos": [["home_hero_slides", ["video_url"]]],
  "business-assets": [],
} as const;

type ServiceClient = NonNullable<ReturnType<typeof createServiceRoleClient>>;

type RpcError = { code?: string | null; message?: string | null } | null;

async function referencedPublicAssetPaths(
  service: ServiceClient,
  bucket: keyof typeof PUBLIC_ASSET_URL_REFERENCES,
  paths: string[],
) {
  let urls: Map<string, string>;
  try {
    urls = new Map(
      paths.map((path) => [getPublicAssetUrl(bucket, path), path]),
    );
  } catch {
    return null;
  }
  const referenced = new Set<string>();
  for (const [table, columns] of PUBLIC_ASSET_URL_REFERENCES[bucket]) {
    const { data, error } = await service.from(table).select(columns.join(","));
    if (error) return null;
    for (const row of data ?? []) {
      for (const column of columns) {
        const value = (row as unknown as Record<string, unknown>)[column];
        const path = urls.get(
          typeof value === "string" ? value.split("?", 1)[0] : "",
        );
        if (path) referenced.add(path);
      }
    }
  }
  if (bucket === "artist-assets") {
    const { data, error } = await service
      .from("avatar_assets")
      .select("image_path");
    if (error) return null;
    for (const row of data ?? []) {
      if (paths.includes(row.image_path)) referenced.add(row.image_path);
    }
  }
  if (bucket === "business-assets") {
    const { data, error } = await service.from("site_settings").select("value");
    if (error) return null;
    for (const row of data ?? []) {
      for (const key of ["pressKitUrl", "profilePdfUrl"]) {
        const path = urls.get(row.value?.[key]);
        if (path) referenced.add(path);
      }
    }
  }
  return referenced;
}

async function isAuditionAttachmentReferenced(
  service: ServiceClient,
  path: string,
) {
  const { data, error } = await service.rpc(
    "audition_submission_has_attachment",
    { p_path: path },
  );
  if (error) return null;
  return data === true;
}

function errorResponse(
  code: string,
  status: number,
  details?: Record<string, unknown>,
) {
  const reason =
    typeof details?.reason === "string" && /^[a-z0-9_]+$/.test(details.reason)
      ? details.reason
      : "";
  console.error(
    `[AdminAssetUpload] Error HTTP ${status} code=${code}${reason ? ` reason=${reason}` : ""}`,
  );
  const response = NextResponse.json({ code }, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request))
    return errorResponse("INVALID_REQUEST", 400, {
      reason: "invalid_origin",
      origin: request.headers.get("origin"),
    });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user)
    return errorResponse("UNAUTHORIZED", 401, {
      reason: "user_auth_failed",
      userError: userError?.message,
    });
  if (!(await isAdmin(supabase, user.id)))
    return errorResponse("FORBIDDEN", 403, {
      reason: "not_admin",
      userId: user.id,
    });
  const attempt = await consumeAdminUploadAttemptRateLimit(request, user.id);
  if (attempt.error)
    return errorResponse("SERVICE_UNAVAILABLE", 503, {
      reason: "rate_limit_check_error",
    });
  if (!attempt.allowed)
    return errorResponse("RATE_LIMITED", 429, { userId: user.id });

  if (request.headers.get("content-type")?.startsWith("application/json")) {
    const body = (await parseJsonWithinLimit(
      request,
      MAX_DELETE_BODY_BYTES,
    ).catch(() => null)) as {
      action?: unknown;
      fileSize?: unknown;
      contentType?: unknown;
      path?: unknown;
    } | null;
    if (body?.action === "prepareHeroVideo") {
      if (
        body.contentType !== "video/mp4" ||
        !Number.isSafeInteger(body.fileSize) ||
        Number(body.fileSize) < 1 ||
        Number(body.fileSize) > HERO_VIDEO_MAX_BYTES
      ) {
        return errorResponse(
          Number(body?.fileSize) > HERO_VIDEO_MAX_BYTES
            ? "FILE_TOO_LARGE"
            : "INVALID_FILE",
          Number(body?.fileSize) > HERO_VIDEO_MAX_BYTES ? 413 : 400,
        );
      }
      const path = `pending/${crypto.randomUUID()}.mp4`;
      const uploadUrl = await createSignedUploadUrl(
        HERO_VIDEO_BUCKET,
        path,
        "video/mp4",
        Number(body.fileSize),
      );
      if (!uploadUrl)
        return errorResponse("SERVICE_UNAVAILABLE", 503, {
          reason: "signed_upload_url_failed",
        });
      return NextResponse.json(
        { upload: { url: uploadUrl, path } },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    if (body?.action === "completeHeroVideo") {
      const path = typeof body.path === "string" ? body.path : "";
      if (
        !/^pending\/[0-9a-f-]{36}\.mp4$/i.test(path) ||
        !isSafeStoragePath(path)
      )
        return errorResponse("INVALID_FILE", 400);
      const source = await getObjectForValidation(
        HERO_VIDEO_BUCKET,
        path,
        HERO_VIDEO_MAX_BYTES,
      );
      if (
        !source ||
        "tooLarge" in source ||
        source.body.byteLength < 1 ||
        source.contentType !== "video/mp4"
      ) {
        await deleteObjects(HERO_VIDEO_BUCKET, [path]);
        return errorResponse(
          source && "tooLarge" in source ? "FILE_TOO_LARGE" : "INVALID_FILE",
          source && "tooLarge" in source ? 413 : 400,
        );
      }
      const file = new File([new Uint8Array(source.body).buffer], "hero.mp4", {
        type: source.contentType,
      });
      if (!(await validateFileSignature(file, "hero-video"))) {
        await deleteObjects(HERO_VIDEO_BUCKET, [path]);
        return errorResponse("INVALID_FILE_TYPE", 400);
      }
      const finalPath = path.replace(/^pending\//, "clips/");
      const { error } = await uploadObject({
        bucket: HERO_VIDEO_BUCKET,
        path: finalPath,
        body: source.body,
        contentType: "video/mp4",
        cacheControl: "public, max-age=31536000, immutable",
      });
      if (error) {
        await deleteObjects(HERO_VIDEO_BUCKET, [path, finalPath]);
        return errorResponse("UPLOAD_FAILED", 503);
      }
      const serviceClient = createServiceRoleClient();
      if (!serviceClient) {
        await deleteObjects(HERO_VIDEO_BUCKET, [path, finalPath]);
        return errorResponse("SERVICE_UNAVAILABLE", 503);
      }
      const { error: auditError } = await serviceClient
        .from("admin_audit_logs")
        .insert({
          actor_id: user.id,
          actor_email: user.email ?? null,
          operation: "UPDATE",
          table_name: "storage.objects",
          record_id: `${HERO_VIDEO_BUCKET}/${finalPath}`,
          record_label: `Hero video: ${finalPath}`,
          changed_fields: ["name", "metadata"],
          after_values: {
            bucket: HERO_VIDEO_BUCKET,
            path: finalPath,
            mime_type: "video/mp4",
            size: source.body.byteLength,
          },
        });
      if (auditError) {
        await deleteObjects(HERO_VIDEO_BUCKET, [path, finalPath]);
        return errorResponse("AUDIT_FAILED", 503);
      }
      await deleteObjects(HERO_VIDEO_BUCKET, [path]);
      return NextResponse.json(
        {
          asset: {
            bucket: HERO_VIDEO_BUCKET,
            path: finalPath,
            url: getPublicAssetUrl(HERO_VIDEO_BUCKET, finalPath),
          },
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    return errorResponse("INVALID_FILE", 400);
  }

  let formData: FormData;
  try {
    const parsed = await parseFormDataWithinLimit(
      request,
      100 * 1024 * 1024 + 64 * 1024,
      3 * 60 * 1000,
    );
    if (!parsed)
      return errorResponse("FILE_TOO_LARGE", 413, {
        reason: "body_size_exceeded_stream_limit",
        limit: "100MB+64KB",
      });
    formData = parsed;
  } catch (error) {
    return errorResponse("INVALID_FILE", 400, {
      reason: "parse_form_data_failed",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const bucket = String(formData.get("bucket") || "");
  const requestedPath = String(formData.get("path") || "");
  const file = formData.get("file");
  const config = BUCKETS[bucket as keyof typeof BUCKETS];
  if (!config || !isSafeStoragePath(requestedPath) || !(file instanceof File)) {
    return errorResponse("INVALID_FILE", 400, {
      reason: "invalid_params",
      bucket,
      requestedPath,
      isFile: file instanceof File,
    });
  }
  const fileSize = file.size;
  if (
    !Number.isSafeInteger(fileSize) ||
    fileSize < 1 ||
    fileSize > config.maxBytes
  ) {
    const isTooLarge = fileSize > config.maxBytes;
    return errorResponse(
      isTooLarge ? "FILE_TOO_LARGE" : "INVALID_FILE",
      isTooLarge ? 413 : 400,
      {
        reason: isTooLarge
          ? "file_size_exceeds_bucket_limit"
          : "invalid_file_size",
        bucket,
        fileSize,
        maxBytes: config.maxBytes,
      },
    );
  }

  const validated = await validateFileSignature(file, config.profile);
  if (!validated)
    return errorResponse("INVALID_FILE_TYPE", 400, {
      reason: "file_signature_mismatch",
      bucket,
      fileName: file.name,
      fileSize,
    });

  let path = `${crypto.randomUUID()}.${validated.extension}`;
  const avatarPath =
    bucket === "artist-assets" ? requestedPath.match(AVATAR_PATH) : null;
  if (avatarPath)
    path = `${avatarPath[1]}/avatars/${crypto.randomUUID()}.${validated.extension}`;
  if (bucket === "business-assets") {
    if (requestedPath === "press-kit.zip" && validated.extension === "zip")
      path = `press-kit/${crypto.randomUUID()}.zip`;
    else if (requestedPath === "profile.pdf" && validated.extension === "pdf")
      path = `profile/${crypto.randomUUID()}.pdf`;
    else
      return errorResponse("INVALID_FILE", 400, {
        reason: "invalid_business_asset_path",
        path,
        extension: validated.extension,
      });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient)
    return errorResponse("SERVICE_UNAVAILABLE", 503, {
      reason: "service_role_client_missing",
    });

  const { error } = await uploadObject({
    bucket,
    path,
    body: file,
    contentType: validated.mimeType,
    cacheControl: "public, max-age=31536000, immutable",
  });
  if (error)
    return errorResponse("UPLOAD_FAILED", 503, {
      reason: "r2_upload_failed",
      bucket,
      path,
    });

  const { error: auditError } = await serviceClient
    .from("admin_audit_logs")
    .insert({
      actor_id: user.id,
      actor_email: user.email ?? null,
      operation: "UPDATE",
      table_name: "storage.objects",
      record_id: `${bucket}/${path}`,
      record_label: `Business asset: ${path}`,
      changed_fields: ["name", "metadata"],
      after_values: {
        bucket,
        path,
        mime_type: validated.mimeType,
        size: fileSize,
      },
    });
  if (auditError) {
    await deleteObjects(bucket, [path]);
    return errorResponse("AUDIT_FAILED", 503, {
      reason: "audit_log_insert_failed",
      bucket,
      path,
      auditError: auditError.message,
    });
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
  if (!isSameOriginRequest(request))
    return errorResponse("INVALID_REQUEST", 400);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return errorResponse("UNAUTHORIZED", 401);
  if (!(await isAdmin(supabase, user.id)))
    return errorResponse("FORBIDDEN", 403);
  const attempt = await consumeAdminUploadAttemptRateLimit(request, user.id);
  if (attempt.error)
    return errorResponse("SERVICE_UNAVAILABLE", 503, {
      reason: "rate_limit_check_error",
    });
  if (!attempt.allowed)
    return errorResponse("RATE_LIMITED", 429, { userId: user.id });
  const body = (await parseJsonWithinLimit(
    request,
    MAX_DELETE_BODY_BYTES,
  ).catch(() => null)) as { bucket?: unknown; paths?: unknown } | null;
  const bucket = typeof body?.bucket === "string" ? body.bucket : "";
  const paths =
    Array.isArray(body?.paths) &&
    body.paths.length <= 100 &&
    body.paths.every(
      (path): path is string =>
        typeof path === "string" && isSafeStoragePath(path),
    )
      ? [...new Set(body.paths)]
      : [];
  if (!ADMIN_DELETE_BUCKETS.has(bucket) || !paths.length)
    return errorResponse("INVALID_FILE", 400);
  if (
    bucket === "audition-attachments" &&
    paths.some((path) => !AUDITION_ATTACHMENT_PATH.test(path))
  )
    return errorResponse("INVALID_FILE", 400);

  const service = createServiceRoleClient();
  if (!service)
    return errorResponse("SERVICE_UNAVAILABLE", 503, {
      reason: "service_role_client_missing",
    });

  // Reserve the asset in Postgres before checking/deleting R2.  The database
  // trigger uses the same advisory key, so concurrent content writes either
  // commit before this check or wait until the reservation is released.
  const reservationArgs = {
    p_bucket: bucket,
    p_paths: paths,
    p_actor_id: user.id,
  };
  const { error: reservationError } = await service.rpc(
    "reserve_r2_asset_deletions",
    reservationArgs,
  );
  if (reservationError) {
    const code = (reservationError as RpcError)?.code;
    if (code === "23514") return errorResponse("FORBIDDEN", 403);
    if (code === "55P03") return errorResponse("ASSET_BUSY", 409);
    return errorResponse("SERVICE_UNAVAILABLE", 503, {
      reason: "asset_reservation_failed",
    });
  }
  const releaseReservation = () =>
    service.rpc("release_r2_asset_deletions", reservationArgs);

  if (bucket === "audition-attachments") {
    const references = await Promise.all(
      paths.map((path) => isAuditionAttachmentReferenced(service, path)),
    );
    if (references.some((value) => value === null)) {
      await releaseReservation();
      return errorResponse("SERVICE_UNAVAILABLE", 503, {
        reason: "attachment_reference_check_failed",
      });
    }
    if (references.some(Boolean)) {
      await releaseReservation();
      return errorResponse("FORBIDDEN", 403);
    }
  } else {
    const referenced = await referencedPublicAssetPaths(
      service,
      bucket as keyof typeof PUBLIC_ASSET_URL_REFERENCES,
      paths,
    );
    if (!referenced) {
      await releaseReservation();
      return errorResponse("SERVICE_UNAVAILABLE", 503, {
        reason: "asset_reference_check_failed",
      });
    }
    if (referenced.size) {
      await releaseReservation();
      return errorResponse("FORBIDDEN", 403);
    }
  }
  const { error } = await deleteObjects(bucket, paths);
  if (error) {
    await releaseReservation();
    return errorResponse("DELETE_FAILED", 503);
  }
  const { error: completionError } = await service.rpc(
    "complete_r2_asset_deletions",
    reservationArgs,
  );
  if (completionError)
    return errorResponse("SERVICE_UNAVAILABLE", 503, {
      reason: "asset_reservation_finalize_failed",
    });
  const { error: auditError } = await service.from("admin_audit_logs").insert(
    paths.map((path) => ({
      actor_id: user.id,
      actor_email: user.email ?? null,
      operation: "DELETE",
      table_name: "storage.objects",
      record_id: `${bucket}/${path}`,
      record_label: `Asset: ${path}`,
      changed_fields: ["name"],
      before_values: { bucket, path },
    })),
  );
  if (auditError) return errorResponse("AUDIT_FAILED", 503);
  return new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
