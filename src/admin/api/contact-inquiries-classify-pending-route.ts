import { NextResponse } from "next/server";
import {
  classify,
  type ContactClassification,
} from "@/core/ai/classify-inquiry";
import { requireAdmin } from "@/core/auth/require-admin";
import { isSameOriginRequest } from "@/core/http/same-origin";
import { createServiceRoleClient } from "@/core/supabase/service";

const BATCH_SIZE = 10;
const CONCURRENCY = 5;

type PendingContact = {
  id: string;
  category: string;
  inquiry_type: string;
  message: string;
};

function response(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

async function classifyOne(
  serviceClient: NonNullable<ReturnType<typeof createServiceRoleClient>>,
  inquiry: PendingContact,
) {
  const result: ContactClassification | null = await classify({
    domain: "contact",
    text: inquiry.message,
    type: inquiry.inquiry_type,
    metadata: { category: inquiry.category },
  });
  if (!result) return false;

  const { data, error } = await serviceClient
    .from("contact_inquiries")
    .update({
      urgency: result.urgency,
      is_likely_spam: result.isLikelySpam,
      ai_reasoning: result.reasoning ?? null,
      ai_classified_at: new Date().toISOString(),
    })
    .eq("id", inquiry.id)
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

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) return response({ code: "SERVICE_UNAVAILABLE" }, 503);

  const { data, error: listError } = await serviceClient
    .from("contact_inquiries")
    .select("id,category,inquiry_type,message")
    .is("ai_classified_at", null)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);
  if (listError) return response({ code: "SERVICE_UNAVAILABLE" }, 503);

  const pending = (data ?? []) as PendingContact[];
  let processed = 0;
  let cursor = 0;
  const worker = async () => {
    while (cursor < pending.length) {
      const inquiry = pending[cursor++];
      try {
        if (await classifyOne(serviceClient, inquiry)) processed += 1;
      } catch {
        // One provider failure must not prevent the remaining items from running.
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, pending.length) }, worker),
  );

  const { count, error: countError } = await serviceClient
    .from("contact_inquiries")
    .select("id", { count: "exact", head: true })
    .is("ai_classified_at", null);
  if (countError) return response({ code: "SERVICE_UNAVAILABLE" }, 503);

  return response({ processed, remaining: count ?? 0 });
}
