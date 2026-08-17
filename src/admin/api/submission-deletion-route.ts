import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/core/auth/require-admin";
import { parseJsonWithinLimit } from "@/core/http/request-body";
import { isSameOriginRequest } from "@/core/http/same-origin";
import { deleteObjects } from "@/core/storage/r2";
import { createServiceRoleClient } from "@/core/supabase/service";
import { isSafeStoragePath } from "@/core/uploads/service-storage";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16 * 1024;
const MAX_CANDIDATES = 50;
const MAX_ATTACHMENTS_PER_CANDIDATE = 100;
const KINDS = ["contact_inquiry", "protect_report"] as const;
const candidateSchema = z.object({
  kind: z.enum(KINDS),
  id: z.string().uuid(),
});
const deletionSchema = z.union([
  z
    .object({ items: z.array(candidateSchema).min(1).max(MAX_CANDIDATES) })
    .transform(({ items }) => ({ candidates: items })),
  z.object({ candidates: z.array(candidateSchema).min(1).max(MAX_CANDIDATES) }),
]);

type ServiceClient = NonNullable<ReturnType<typeof createServiceRoleClient>>;
type Candidate = z.infer<typeof candidateSchema>;
type PrivateBucket = "contact-attachments" | "protect-evidence";
type ReservedAttachment = { bucket: PrivateBucket; path: string };

function response(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function rpcCode(error: unknown) {
  if (!error || typeof error !== "object") return "SERVICE_UNAVAILABLE";
  const value = error as { code?: unknown; message?: unknown };
  const code = typeof value.code === "string" ? value.code : "";
  const message = typeof value.message === "string" ? value.message : "";
  if (code === "55P03" || /busy|reserved/i.test(message)) return "ASSET_BUSY";
  if (code === "42501" || /administrator access|required/i.test(message))
    return "FORBIDDEN";
  if (code === "P0002" || /not found|already deleted/i.test(message))
    return "NOT_FOUND";
  return "SERVICE_UNAVAILABLE";
}

function mapReservedAttachments(data: unknown): ReservedAttachment[] | null {
  if (!Array.isArray(data) || data.length > MAX_ATTACHMENTS_PER_CANDIDATE)
    return null;
  const attachments: ReservedAttachment[] = [];
  for (const row of data) {
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

async function markRetry(
  service: ServiceClient,
  item: Candidate,
  actorId: string,
  reservationId: string,
  objectsDeleted: boolean,
) {
  return service.rpc("retry_retention_deletion", {
    p_kind: item.kind,
    p_id: item.id,
    p_actor_id: actorId,
    p_reservation_id: reservationId,
    p_objects_deleted: objectsDeleted,
  });
}

async function deleteOne(
  service: ServiceClient,
  item: Candidate,
  actorId: string,
) {
  const reservationId = crypto.randomUUID();
  const reservation = await service.rpc("reserve_submission_deletion", {
    p_kind: item.kind,
    p_id: item.id,
    p_actor_id: actorId,
    p_reservation_id: reservationId,
  });
  if (reservation.error)
    return { item, deleted: false, code: rpcCode(reservation.error) } as const;

  const attachments = mapReservedAttachments(reservation.data);
  if (!attachments) {
    await markRetry(service, item, actorId, reservationId, false);
    return { item, deleted: false, code: "SERVICE_UNAVAILABLE" } as const;
  }

  const byBucket = new Map<PrivateBucket, string[]>();
  for (const attachment of attachments) {
    const paths = byBucket.get(attachment.bucket) ?? [];
    paths.push(attachment.path);
    byBucket.set(attachment.bucket, paths);
  }
  for (const [bucket, paths] of byBucket) {
    const result = await deleteObjects(bucket, [...new Set(paths)]);
    if (result.error) {
      await markRetry(service, item, actorId, reservationId, false);
      return { item, deleted: false, code: "DELETE_FAILED" } as const;
    }
  }

  // Keep the reservation in objects_deleted before touching the database row.
  // A retry can then finalize without issuing another R2 delete.
  const marked = await markRetry(service, item, actorId, reservationId, true);
  if (marked.error)
    return { item, deleted: false, code: "RETRY_REQUIRED" } as const;

  const finalized = await service.rpc("finalize_retention_deletion", {
    p_kind: item.kind,
    p_id: item.id,
    p_actor_id: actorId,
    p_reservation_id: reservationId,
    p_objects_deleted: true,
  });
  if (finalized.error) {
    await markRetry(service, item, actorId, reservationId, true);
    return { item, deleted: false, code: "RETRY_REQUIRED" } as const;
  }
  return { item, deleted: true } as const;
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request))
    return response({ code: "INVALID_REQUEST" }, 400);

  const auth = await requireAdmin();
  if (auth.denied)
    return response({ code: auth.denied.code }, auth.denied.status);

  const body = await parseJsonWithinLimit(request, MAX_BODY_BYTES).catch(
    () => null,
  );
  const parsed = deletionSchema.safeParse(body);
  if (!parsed.success) return response({ code: "INVALID_REQUEST" }, 400);

  const service = createServiceRoleClient();
  if (!service) return response({ code: "SERVICE_UNAVAILABLE" }, 503);

  const candidates = [
    ...new Map(
      parsed.data.candidates.map((candidate) => [
        `${candidate.kind}:${candidate.id}`,
        candidate,
      ]),
    ).values(),
  ];
  const results = [];
  for (const candidate of candidates) {
    try {
      results.push(await deleteOne(service, candidate, auth.user.id));
    } catch {
      results.push({
        item: candidate,
        deleted: false,
        code: "SERVICE_UNAVAILABLE",
      });
    }
  }

  const deleted = results
    .filter((result) => result.deleted)
    .map((result) => result.item);
  const failed = results
    .filter((result) => !result.deleted)
    .map((result) => ({ ...result.item, code: result.code }));
  return response(
    {
      deleted,
      failed,
      deleted_count: deleted.length,
      failed_count: failed.length,
    },
    failed.length ? (deleted.length ? 207 : 503) : 200,
  );
}

export const DELETE = POST;
