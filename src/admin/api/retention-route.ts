import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isSuperAdmin } from "@/core/auth/admin-auth";
import { parseJsonWithinLimit } from "@/core/http/request-body";
import { isSameOriginRequest } from "@/core/http/same-origin";
import { deleteObjects } from "@/core/storage/r2";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { createServiceRoleClient } from "@/core/supabase/service";
import { isSafeStoragePath } from "@/core/uploads/service-storage";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16 * 1024;
const MAX_CANDIDATES = 50;
const MAX_ATTACHMENTS_PER_CANDIDATE = 100;
const RETENTION_KINDS = ["contact_inquiry", "protect_report"] as const;

const candidateSchema = z.object({
  kind: z.enum(RETENTION_KINDS),
  id: z.string().uuid(),
});
const purgeSchema = z.object({
  candidates: z.array(candidateSchema).min(1).max(MAX_CANDIDATES),
});

type ServiceClient = NonNullable<ReturnType<typeof createServiceRoleClient>>;
type Candidate = z.infer<typeof candidateSchema> & {
  created_at: string;
  expires_at: string;
  attachment_count: number;
  retryable: boolean;
};
type ReservedAttachment = {
  bucket: "contact-attachments" | "protect-evidence";
  path: string;
};

function response(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function sameOriginRead(request: Request) {
  return (
    isSameOriginRequest(request) ||
    request.headers.get("sec-fetch-site") === "same-origin"
  );
}

async function requireSuperAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { error: response({ code: "UNAUTHORIZED" }, 401) };
  if (!(await isSuperAdmin(supabase, user.id)))
    return { error: response({ code: "FORBIDDEN" }, 403) };
  return { user };
}

function mapCandidate(row: unknown): Candidate | null {
  if (!row || typeof row !== "object") return null;
  const value = row as Record<string, unknown>;
  const parsed = candidateSchema.safeParse({
    kind: value.kind,
    id: value.id,
  });
  if (!parsed.success || typeof value.created_at !== "string") return null;
  const expiresAt =
    typeof value.expires_at === "string"
      ? value.expires_at
      : new Date(
          new Date(value.created_at).getTime() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString();
  const attachmentCount = Number(value.attachment_count ?? 0);
  if (
    !Number.isSafeInteger(attachmentCount) ||
    attachmentCount < 0 ||
    attachmentCount > MAX_ATTACHMENTS_PER_CANDIDATE
  )
    return null;
  return {
    ...parsed.data,
    created_at: value.created_at,
    expires_at: expiresAt,
    attachment_count: attachmentCount,
    retryable: value.retryable === true || value.status === "retryable",
  };
}

function mapReservedAttachments(data: unknown): ReservedAttachment[] | null {
  const rows = Array.isArray(data)
    ? data
    : data && typeof data === "object"
      ? (() => {
          const attachments = (data as Record<string, unknown>).attachments;
          return Array.isArray(attachments) ? attachments : [data];
        })()
      : [];
  if (rows.length > MAX_ATTACHMENTS_PER_CANDIDATE) return null;
  const attachments: ReservedAttachment[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") return null;
    const value = row as Record<string, unknown>;
    const bucket = value.bucket;
    const path = value.path;
    if (
      (bucket !== "contact-attachments" && bucket !== "protect-evidence") ||
      typeof path !== "string" ||
      !isSafeStoragePath(path)
    )
      return null;
    attachments.push({ bucket, path });
  }
  return attachments;
}

function rpcCode(error: unknown) {
  if (!error || typeof error !== "object") return "SERVICE_UNAVAILABLE";
  const value = error as { code?: unknown; message?: unknown };
  const code = typeof value.code === "string" ? value.code : "";
  const message = typeof value.message === "string" ? value.message : "";
  if (code === "55P03" || /busy|reserved/i.test(message)) return "ASSET_BUSY";
  if (code === "42501" || /forbidden|administrator access/i.test(message))
    return "FORBIDDEN";
  if (code === "P0002" || /not found/i.test(message)) return "NOT_FOUND";
  return "SERVICE_UNAVAILABLE";
}

async function retryReservation(
  service: ServiceClient,
  item: z.infer<typeof candidateSchema>,
  actorId: string,
  reservationId: string,
  objectsDeleted: boolean,
) {
  // This RPC intentionally preserves a failed reservation for the retry/orphan
  // scanner.  Releasing after R2 succeeds would leave a live database reference
  // to a missing object and make recovery impossible.
  await service.rpc("retry_retention_deletion", {
    p_kind: item.kind,
    p_id: item.id,
    p_actor_id: actorId,
    p_reservation_id: reservationId,
    p_objects_deleted: objectsDeleted,
  });
}

async function purgeOne(
  service: ServiceClient,
  item: z.infer<typeof candidateSchema>,
  actorId: string,
) {
  const reservationId = crypto.randomUUID();
  const reservation = await service.rpc("reserve_retention_deletion", {
    p_kind: item.kind,
    p_id: item.id,
    p_actor_id: actorId,
    p_reservation_id: reservationId,
  });
  if (reservation.error)
    return { item, code: rpcCode(reservation.error), deleted: false } as const;

  const attachments = mapReservedAttachments(reservation.data);
  if (!attachments) {
    await retryReservation(service, item, actorId, reservationId, false);
    return { item, code: "SERVICE_UNAVAILABLE", deleted: false } as const;
  }

  const byBucket = new Map<ReservedAttachment["bucket"], string[]>();
  for (const attachment of attachments) {
    const paths = byBucket.get(attachment.bucket) ?? [];
    paths.push(attachment.path);
    byBucket.set(attachment.bucket, paths);
  }
  for (const [bucket, paths] of byBucket) {
    const result = await deleteObjects(bucket, [...new Set(paths)]);
    if (result.error) {
      await retryReservation(service, item, actorId, reservationId, false);
      return { item, code: "DELETE_FAILED", deleted: false } as const;
    }
  }

  // Persist this boundary before deleting the database row. If the finalizer
  // is unavailable, a later retry must not issue another R2 delete.
  await retryReservation(service, item, actorId, reservationId, true);

  const finalized = await service.rpc("finalize_retention_deletion", {
    p_kind: item.kind,
    p_id: item.id,
    p_actor_id: actorId,
    p_reservation_id: reservationId,
    p_objects_deleted: true,
  });
  if (finalized.error) {
    await retryReservation(service, item, actorId, reservationId, true);
    return { item, code: "RETRY_REQUIRED", deleted: false } as const;
  }
  return { item, deleted: true } as const;
}

export async function GET(request: NextRequest) {
  if (!sameOriginRead(request)) return response({ code: "INVALID_REQUEST" }, 400);
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;
  const service = createServiceRoleClient();
  if (!service) return response({ code: "SERVICE_UNAVAILABLE" }, 503);

  const rawLimit = Number(request.nextUrl.searchParams.get("limit") ?? 100);
  const limit = Number.isSafeInteger(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), MAX_CANDIDATES * 2)
    : 100;
  const { data, error } = await service.rpc("get_retention_candidates", {
    p_limit: limit,
  });
  if (error) return response({ code: "SERVICE_UNAVAILABLE" }, 503);

  const candidates = Array.isArray(data)
    ? data.flatMap((row) => {
        const mapped = mapCandidate(row);
        return mapped ? [mapped] : [];
      })
    : [];
  return response({
    policy: { days: 30, basis: "created_at" },
    candidates,
  });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request))
    return response({ code: "INVALID_REQUEST" }, 400);
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;
  const body = await parseJsonWithinLimit(request, MAX_BODY_BYTES).catch(
    () => null,
  );
  const parsed = purgeSchema.safeParse(body);
  if (!parsed.success) return response({ code: "INVALID_REQUEST" }, 400);

  const service = createServiceRoleClient();
  if (!service) return response({ code: "SERVICE_UNAVAILABLE" }, 503);
  const unique = [
    ...new Map(
      parsed.data.candidates.map((candidate) => [
        `${candidate.kind}:${candidate.id}`,
        candidate,
      ]),
    ).values(),
  ];
  const results = [];
  for (const item of unique) {
    try {
      results.push(await purgeOne(service, item, auth.user.id));
    } catch {
      results.push({ item, code: "SERVICE_UNAVAILABLE", deleted: false });
    }
  }
  const deleted = results.filter((result) => result.deleted).map((result) => result.item);
  const failed = results
    .filter((result) => !result.deleted)
    .map((result) => ({ ...result.item, code: result.code }));
  return response(
    { deleted, failed, deleted_count: deleted.length, failed_count: failed.length },
    failed.length ? (deleted.length ? 207 : 503) : 200,
  );
}
