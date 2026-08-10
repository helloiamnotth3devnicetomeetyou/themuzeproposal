import "server-only";

import { createHmac } from "node:crypto";
import type { NextRequest } from "next/server";
import { clientIp } from "@/core/http/client-ip";
import { createServiceRoleClient } from "@/core/uploads/service-storage";

export type SubmissionScope = "contact_inquiry" | "protect_report" | "audition_submission";
type SubmissionAttemptScope = `${SubmissionScope}_attempt`;
type RateLimitScope = SubmissionScope | SubmissionAttemptScope | "admin_upload_attempt";

export const DAILY_SUBMISSION_LIMIT = 5;
const IP_DAILY_LIMIT = 500;
const WINDOW_SECONDS = 24 * 60 * 60;
const ATTEMPT_LIMIT = 30;
const IP_ATTEMPT_LIMIT = 100;
const ATTEMPT_WINDOW_SECONDS = 15 * 60;

function hashIdentifier(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

async function consumeRateLimit(
  request: NextRequest,
  scope: RateLimitScope,
  userId: string,
  userLimit: number,
  ipLimit: number,
  windowSeconds: number,
) {
  const client = createServiceRoleClient();
  const secret = process.env.SUBMISSION_RATE_LIMIT_SECRET?.trim();
  if (!client || !secret) return { error: true as const };

  const ip = clientIp(request);
  if (!ip && process.env.NODE_ENV === "production") return { error: true as const };
  const calls = [
    client.rpc("consume_submission_rate_limit", {
      p_scope: scope,
      p_key_hash: hashIdentifier(`${scope}:uid:${userId}`, secret),
      p_limit: userLimit,
      p_window_seconds: windowSeconds,
    }),
  ];
  if (ip) {
    calls.push(
      client.rpc("consume_submission_rate_limit", {
        p_scope: scope,
        p_key_hash: hashIdentifier(`${scope}:ip:${ip}`, secret),
        p_limit: ipLimit,
        p_window_seconds: windowSeconds,
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
      retryAfter: Number(d?.retry_after_seconds) || windowSeconds,
    };
  });

  const blocked = parsed.find((p) => !p.allowed);
  return {
    error: false as const,
    allowed: !blocked,
    remaining: parsed[0].remaining,
    retryAfter: Math.max(1, blocked?.retryAfter ?? windowSeconds),
  };
}

export function consumeSubmissionAttemptRateLimit(request: NextRequest, scope: SubmissionScope, userId: string) {
  return consumeRateLimit(request, `${scope}_attempt`, userId, ATTEMPT_LIMIT, IP_ATTEMPT_LIMIT, ATTEMPT_WINDOW_SECONDS);
}

export function consumeSubmissionRateLimit(request: NextRequest, scope: SubmissionScope, userId: string) {
  return consumeRateLimit(request, scope, userId, DAILY_SUBMISSION_LIMIT, IP_DAILY_LIMIT, WINDOW_SECONDS);
}

export function consumeAdminUploadAttemptRateLimit(request: NextRequest, userId: string) {
  return consumeRateLimit(request, "admin_upload_attempt", userId, 10, 100, 60 * 60);
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
