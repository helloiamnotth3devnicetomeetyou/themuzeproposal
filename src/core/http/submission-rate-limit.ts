import "server-only";

import { createHmac } from "node:crypto";
import type { NextRequest } from "next/server";
import { clientIp } from "@/core/http/client-ip";
import { createServiceRoleClient } from "@/core/uploads/service-storage";

export type SubmissionScope = "contact_inquiry" | "protect_report" | "audition_submission";

export const DAILY_SUBMISSION_LIMIT = 5;
const IP_DAILY_LIMIT = 500;
const WINDOW_SECONDS = 24 * 60 * 60;

function hashIdentifier(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export async function consumeSubmissionRateLimit(
  request: NextRequest,
  scope: SubmissionScope,
  userId: string,
) {
  const client = createServiceRoleClient();
  const secret = process.env.SUBMISSION_RATE_LIMIT_SECRET?.trim();
  if (!client || !secret) return { error: true as const };

  const ip = clientIp(request);
  const calls = [
    client.rpc("consume_submission_rate_limit", {
      p_scope: scope,
      p_key_hash: hashIdentifier(`${scope}:uid:${userId}`, secret),
      p_limit: DAILY_SUBMISSION_LIMIT,
      p_window_seconds: WINDOW_SECONDS,
    }),
  ];
  if (ip) {
    calls.push(
      client.rpc("consume_submission_rate_limit", {
        p_scope: scope,
        p_key_hash: hashIdentifier(`${scope}:ip:${ip}`, secret),
        p_limit: IP_DAILY_LIMIT,
        p_window_seconds: WINDOW_SECONDS,
      }),
    );
  }

  const results = await Promise.all(calls);
  if (results.some((r) => r.error)) return { error: true as const };

  const parsed = results.map((r) => {
    const d = Array.isArray(r.data) ? r.data[0] : r.data;
    return {
      allowed: Boolean(d?.is_allowed),
      remaining: Math.max(0, Number(d?.remaining) || 0),
      retryAfter: Number(d?.retry_after_seconds) || WINDOW_SECONDS,
    };
  });

  const blocked = parsed.find((p) => !p.allowed);
  return {
    error: false as const,
    allowed: !blocked,
    remaining: parsed[0].remaining,
    retryAfter: Math.max(1, blocked?.retryAfter ?? WINDOW_SECONDS),
  };
}

export async function getSubmissionRemaining(scope: SubmissionScope, userId: string) {
  const client = createServiceRoleClient();
  const secret = process.env.SUBMISSION_RATE_LIMIT_SECRET?.trim();
  if (!client || !secret) return 0;
  const { data, error } = await client.rpc("get_submission_rate_limit_remaining", {
    p_scope: scope,
    p_key_hash: hashIdentifier(`${scope}:uid:${userId}`, secret),
    p_limit: DAILY_SUBMISSION_LIMIT,
    p_window_seconds: WINDOW_SECONDS,
  });
  if (error) return 0;
  const value = Array.isArray(data) ? data[0]?.remaining : data?.remaining;
  return Math.max(0, Math.min(DAILY_SUBMISSION_LIMIT, Number(value) || 0));
}
