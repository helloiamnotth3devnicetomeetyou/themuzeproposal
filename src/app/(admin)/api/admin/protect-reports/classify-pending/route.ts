import { requireAdmin } from "@/core/auth/require-admin";
import {
  classify,
  type ProtectClassification,
} from "@/core/ai/classify-inquiry";
import { isSameOriginRequest } from "@/core/http/same-origin";
import { createServiceRoleClient } from "@/core/supabase/service";

export const runtime = "nodejs";

const BATCH_SIZE = 10;
const CONCURRENCY = 5;
type PendingReport = {
  id: string;
  report_type: string;
  title: string;
  content: string;
  platform: string;
};

function response(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function classifyAndSave(
  service: NonNullable<ReturnType<typeof createServiceRoleClient>>,
  report: PendingReport,
) {
  const result: ProtectClassification | null = await classify({
    domain: "protect",
    text: `${report.title}\n\n${report.content}`,
    type: report.report_type,
    metadata: { platform: report.platform },
  });
  if (!result) return false;

  const { data, error } = await service
    .from("protect_reports")
    .update({
      severity: result.severity,
      ai_reasoning: result.reasoning,
      ai_classified_at: new Date().toISOString(),
    })
    .eq("id", report.id)
    .is("ai_classified_at", null)
    .select("id")
    .maybeSingle();
  return !error && Boolean(data);
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return response({ code: "FORBIDDEN" }, 403);

  const auth = await requireAdmin();
  if (auth.denied)
    return response({ code: auth.denied.code }, auth.denied.status);

  const service = createServiceRoleClient();
  if (!service) return response({ code: "SERVICE_UNAVAILABLE" }, 503);

  const { data: reports, error: selectError } = await service
    .from("protect_reports")
    .select("id,report_type,title,content,platform")
    .is("ai_classified_at", null)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);
  if (selectError) return response({ code: "SERVICE_UNAVAILABLE" }, 503);

  const pending = (reports ?? []) as PendingReport[];
  let processed = 0;
  let cursor = 0;
  const worker = async () => {
    while (cursor < pending.length) {
      const report = pending[cursor++];
      try {
        if (await classifyAndSave(service, report)) processed += 1;
      } catch {
        // A single model/provider failure must not stop the rest of the batch.
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, pending.length) }, () =>
      worker(),
    ),
  );

  const { count, error: countError } = await service
    .from("protect_reports")
    .select("id", { count: "exact", head: true })
    .is("ai_classified_at", null);
  if (countError) return response({ code: "SERVICE_UNAVAILABLE" }, 503);
  return response({ processed, remaining: count ?? 0 });
}
