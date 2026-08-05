import "server-only";

import { createHmac } from "node:crypto";
import type { NextRequest } from "next/server";
import { clientIp } from "@/core/http/client-ip";
import { createServiceRoleClient } from "@/core/uploads/service-storage";

export type SubmissionScope = "contact_inquiry" | "protect_report" | "audition_submission";

const LIMITS: Record<SubmissionScope, { limit: number; windowSeconds: number }> = {
  contact_inquiry: { limit: 5, windowSeconds: 15 * 60 },
  protect_report: { limit: 5, windowSeconds: 15 * 60 },
  audition_submission: { limit: 3, windowSeconds: 24 * 60 * 60 },
};

function hashIdentifier(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export async function consumeSubmissionRateLimit(
  request: NextRequest,
  scope: SubmissionScope,
  userId?: string,
) {
  const client = createServiceRoleClient();
  const secret = process.env.SUBMISSION_RATE_LIMIT_SECRET?.trim();
  if (!client || !secret) return { error: true as const };

  const config = LIMITS[scope];
  const ipHash = hashIdentifier(`${scope}:ip:${clientIp(request)}`, secret);

  const calls = [
    client.rpc("consume_submission_rate_limit", {
      p_scope: scope,
      p_key_hash: ipHash,
      p_limit: config.limit,
      p_window_seconds: config.windowSeconds,
    }),
  ];

  if (userId) {
    const userHash = hashIdentifier(`${scope}:uid:${userId}`, secret);
    calls.push(
      client.rpc("consume_submission_rate_limit", {
        p_scope: scope,
        p_key_hash: userHash,
        p_limit: config.limit,
        p_window_seconds: config.windowSeconds,
      }),
    );
  }

  const results = await Promise.all(calls);
  if (results.some((r) => r.error)) return { error: true as const };

  const parsed = results.map((r) => {
    const d = Array.isArray(r.data) ? r.data[0] : r.data;
    return {
      allowed: Boolean(d?.is_allowed),
      retryAfter: Number(d?.retry_after_seconds) || config.windowSeconds,
    };
  });

  const blocked = parsed.find((p) => !p.allowed);
  return {
    error: false as const,
    allowed: !blocked,
    retryAfter: Math.max(1, blocked?.retryAfter ?? config.windowSeconds),
  };
}
