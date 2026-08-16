import { NextResponse } from "next/server";
import {
  listRetentionCandidates,
  purgeRetentionCandidates,
} from "@/admin/api/retention-route";
import { createServiceRoleClient } from "@/core/supabase/service";

export const runtime = "nodejs";

const MAX_CRON_CANDIDATES = 25;

function response(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function hasCronSecret(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  return Boolean(
    secret && request.headers.get("authorization") === `Bearer ${secret}`,
  );
}

export async function GET(request: Request) {
  if (!hasCronSecret(request)) return response({ code: "UNAUTHORIZED" }, 401);

  const service = createServiceRoleClient();
  if (!service) return response({ code: "SERVICE_UNAVAILABLE" }, 503);

  const listed = await listRetentionCandidates(service, MAX_CRON_CANDIDATES);
  if (listed.error) return response({ code: "SERVICE_UNAVAILABLE" }, 503);

  const results = await purgeRetentionCandidates(
    service,
    listed.candidates.map(({ kind, id }) => ({ kind, id })),
    null,
  );
  const deleted = results.filter((result) => result.deleted).length;
  const failed = results
    .filter((result) => !result.deleted)
    .map((result) => ({ ...result.item, code: result.code }));

  return response(
    {
      processed: results.length,
      deleted,
      failed,
    },
    failed.length && !deleted ? 503 : 200,
  );
}
