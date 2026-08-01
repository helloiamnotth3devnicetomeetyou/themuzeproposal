import "server-only";

import { createHmac } from "node:crypto";
import type { NextRequest } from "next/server";
import { clientIp } from "@/core/http/client-ip";
import { createServiceRoleClient } from "@/core/uploads/service-storage";

export type SubmissionScope = "contact_inquiry" | "protect_report";

const LIMITS: Record<SubmissionScope, { limit: number; windowSeconds: number }> = {
  contact_inquiry: { limit: 5, windowSeconds: 15 * 60 },
  protect_report: { limit: 5, windowSeconds: 15 * 60 },
};

function hashIdentifier(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export async function consumeSubmissionRateLimit(request: NextRequest, scope: SubmissionScope) {
  const client = createServiceRoleClient();
  const secret = process.env.SUBMISSION_RATE_LIMIT_SECRET?.trim();
  if (!client || !secret) return { error: true as const };

  const config = LIMITS[scope];
  const keyHash = hashIdentifier(`${scope}:ip:${clientIp(request)}`, secret);
  const { data, error } = await client.rpc("consume_submission_rate_limit", {
    p_scope: scope,
    p_key_hash: keyHash,
    p_limit: config.limit,
    p_window_seconds: config.windowSeconds,
  });
  if (error) return { error: true as const };

  const result = Array.isArray(data) ? data[0] : data;
  return {
    error: false as const,
    allowed: Boolean(result?.is_allowed),
    retryAfter: Math.max(1, Number(result?.retry_after_seconds) || config.windowSeconds),
  };
}
