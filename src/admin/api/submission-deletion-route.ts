import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/core/auth/require-admin";
import { parseJsonWithinLimit } from "@/core/http/request-body";
import { isSameOriginRequest } from "@/core/http/same-origin";
import { createServiceRoleClient } from "@/core/supabase/service";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16 * 1024;
const MAX_CANDIDATES = 50;
const KINDS = ["contact_inquiry", "protect_report"] as const;
const candidateSchema = z.object({
  kind: z.enum(KINDS),
  id: z.string().uuid(),
});
const itemsSchema = z.array(candidateSchema).min(1).max(MAX_CANDIDATES);
const action = z.enum(["trash", "restore"]).default("trash");
const deletionSchema = z.union([
  z
    .object({ items: itemsSchema, action })
    .transform(({ items, action: mode }) => ({ candidates: items, action: mode })),
  z.object({ candidates: itemsSchema, action }),
]);

type Candidate = z.infer<typeof candidateSchema>;

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
  const trashed = parsed.data.action === "trash";

  // The row and its files stay put: the retention screen is the only place that
  // erases them, so a mistaken deletion is recoverable for 30 days.
  const moved = new Set<string>();
  let failureCode = "";
  for (const kind of KINDS) {
    const ids = candidates
      .filter((candidate) => candidate.kind === kind)
      .map((candidate) => candidate.id);
    if (!ids.length) continue;
    const { data, error } = await service.rpc("set_submission_trash", {
      p_kind: kind,
      p_ids: ids,
      p_actor_id: auth.user.id,
      p_trashed: trashed,
    });
    if (error) {
      failureCode = rpcCode(error);
      continue;
    }
    for (const row of Array.isArray(data) ? data : []) {
      const id = typeof row === "string" ? row : (row as { id?: unknown })?.id;
      if (typeof id === "string") moved.add(`${kind}:${id}`);
    }
  }

  const isMoved = (candidate: Candidate) =>
    moved.has(`${candidate.kind}:${candidate.id}`);
  const deleted = candidates.filter(isMoved);
  const failed = candidates
    .filter((candidate) => !isMoved(candidate))
    .map((candidate) => ({
      ...candidate,
      code: failureCode || "NOT_FOUND",
    }));
  return response(
    {
      deleted,
      failed,
      action: parsed.data.action,
      deleted_count: deleted.length,
      failed_count: failed.length,
    },
    failed.length ? (deleted.length ? 207 : 503) : 200,
  );
}

export const DELETE = POST;
