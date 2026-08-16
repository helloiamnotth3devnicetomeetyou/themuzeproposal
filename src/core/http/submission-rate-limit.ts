import "server-only";

import { createHmac } from "node:crypto";
import type { NextRequest } from "next/server";
import { clientIp } from "@/core/http/client-ip";
import { createServiceRoleClient } from "@/core/uploads/service-storage";

export type SubmissionScope =
  "contact_inquiry" | "protect_report" | "audition_submission";
type SubmissionAttemptScope = `${SubmissionScope}_attempt`;
type RateLimitScope =
  SubmissionScope | SubmissionAttemptScope | "admin_upload_attempt";

export const DAILY_SUBMISSION_LIMIT = 5;
const IP_DAILY_LIMIT = 500;
const WINDOW_SECONDS = 24 * 60 * 60;
const ATTEMPT_LIMIT = 30;
const IP_ATTEMPT_LIMIT = 100;
const ATTEMPT_WINDOW_SECONDS = 15 * 60;

type RateLimitSuccess = {
  error: false;
  allowed: boolean;
  remaining: number;
  retryAfter: number;
  reservationId?: string | null;
};
type RateLimitFailure = { error: true };
export type SubmissionRateLimitResult = RateLimitSuccess | RateLimitFailure;
export type SubmissionRateLimitReservation =
  (RateLimitSuccess & { reservationId: string | null }) | RateLimitFailure;

function hashIdentifier(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function rowFrom(data: unknown): Record<string, unknown> | null {
  const row = Array.isArray(data) ? data[0] : data;
  return row && typeof row === "object"
    ? (row as Record<string, unknown>)
    : null;
}

function parseRateLimitRow(
  data: unknown,
  windowSeconds: number,
  limit: number,
) {
  const row = rowFrom(data);
  if (!row || typeof row.is_allowed !== "boolean") return null;
  const remainingValue = Number(row.remaining);
  const retryAfterValue = Number(row.retry_after_seconds);
  return {
    allowed: row.is_allowed,
    remaining: Number.isFinite(remainingValue)
      ? Math.max(0, Math.min(limit, remainingValue))
      : 0,
    retryAfter:
      Number.isFinite(retryAfterValue) && retryAfterValue > 0
        ? retryAfterValue
        : windowSeconds,
  };
}

function parseReservationRow(
  data: unknown,
  windowSeconds: number,
  limit: number,
) {
  const parsed = parseRateLimitRow(data, windowSeconds, limit);
  if (!parsed) return null;
  const row = rowFrom(data)!;
  const reservationId =
    typeof row.reservation_id === "string" && row.reservation_id
      ? row.reservation_id
      : null;
  return { ...parsed, reservationId };
}

function config() {
  const client = createServiceRoleClient();
  const secret = process.env.SUBMISSION_RATE_LIMIT_SECRET?.trim();
  return client && secret ? { client, secret } : null;
}

function localNoop(limit: number, windowSeconds: number): RateLimitSuccess {
  return {
    error: false,
    allowed: true,
    remaining: limit,
    retryAfter: windowSeconds,
  };
}

async function consumeSingleRateLimit(
  scope: RateLimitScope,
  key: string,
  limit: number,
  windowSeconds: number,
  secret: string,
  client: NonNullable<ReturnType<typeof createServiceRoleClient>>,
): Promise<SubmissionRateLimitResult> {
  const { data, error } = await client.rpc("consume_submission_rate_limit", {
    p_scope: scope,
    p_key_hash: hashIdentifier(key, secret),
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) return { error: true };
  const parsed = parseRateLimitRow(data, windowSeconds, limit);
  return parsed ? { error: false, ...parsed } : { error: true };
}

async function consumeAdminRateLimit(request: NextRequest, userId: string) {
  const setup = config();
  if (!setup) return { error: true as const };

  const ip = clientIp(request);
  if (!ip && process.env.NODE_ENV === "production")
    return { error: true as const };

  const scope = "admin_upload_attempt" as const;
  const calls: Promise<SubmissionRateLimitResult>[] = [
    consumeSingleRateLimit(
      scope,
      `${scope}:uid:${userId}`,
      30,
      60 * 60,
      setup.secret,
      setup.client,
    ),
  ];
  if (ip) {
    calls.push(
      consumeSingleRateLimit(
        scope,
        `${scope}:ip:${ip}`,
        100,
        60 * 60,
        setup.secret,
        setup.client,
      ),
    );
  }

  const results = await Promise.all(calls);
  if (results.some((result) => result.error)) return { error: true as const };
  const parsed = results as Array<
    Exclude<SubmissionRateLimitResult, RateLimitFailure>
  >;
  const blocked = parsed.find((result) => !result.allowed);
  return {
    error: false as const,
    allowed: !blocked,
    remaining: blocked?.remaining ?? parsed[0].remaining,
    retryAfter: Math.max(1, blocked?.retryAfter ?? 60 * 60),
  };
}

/** Reserve the daily quota. The RPC must update both keys atomically. */
export async function reserveSubmissionRateLimit(
  request: NextRequest,
  scope: SubmissionScope,
  userId: string,
): Promise<SubmissionRateLimitReservation> {
  const setup = config();
  if (!setup) return { error: true };

  const ip = clientIp(request);
  if (!ip && process.env.NODE_ENV === "production") return { error: true };

  const { data, error } = await setup.client.rpc(
    "reserve_submission_rate_limit",
    {
      p_scope: scope,
      p_user_key_hash: hashIdentifier(`${scope}:uid:${userId}`, setup.secret),
      p_user_limit: DAILY_SUBMISSION_LIMIT,
      p_ip_key_hash: ip
        ? hashIdentifier(`${scope}:ip:${ip}`, setup.secret)
        : null,
      p_ip_limit: IP_DAILY_LIMIT,
      p_window_seconds: WINDOW_SECONDS,
    },
  );
  if (error) return { error: true };

  const parsed = parseReservationRow(
    data,
    WINDOW_SECONDS,
    DAILY_SUBMISSION_LIMIT,
  );
  if (!parsed || (parsed.allowed && !parsed.reservationId))
    return { error: true };
  return { error: false, ...parsed };
}

/** Finalization is intentionally idempotent in the database RPC. */
export async function finalizeSubmissionRateLimit(reservationId: string) {
  const setup = config();
  if (!setup || !reservationId) return { error: true as const };
  const { error } = await setup.client.rpc("finalize_submission_rate_limit", {
    p_reservation_id: reservationId,
  });
  return error ? { error: true as const } : { error: false as const };
}

/** Release is safe to retry when an upload or database write fails. */
export async function releaseSubmissionRateLimit(reservationId: string) {
  const setup = config();
  if (!setup || !reservationId) return { error: true as const };
  const { error } = await setup.client.rpc("release_submission_rate_limit", {
    p_reservation_id: reservationId,
  });
  return error ? { error: true as const } : { error: false as const };
}

/**
 * Compatibility name for callers being migrated to reserve/finalize.
 * Daily quotas must be finalized or released by the caller.
 */
export function consumeSubmissionRateLimit(
  request: NextRequest,
  scope: SubmissionScope,
  userId: string,
) {
  return reserveSubmissionRateLimit(request, scope, userId);
}

export async function consumeSubmissionAttemptIpRateLimit(
  request: NextRequest,
  scope: SubmissionScope,
) {
  const setup = config();
  const ip = clientIp(request);
  if (!setup) return { error: true as const };
  if (!ip)
    return process.env.NODE_ENV === "production"
      ? { error: true as const }
      : localNoop(IP_ATTEMPT_LIMIT, ATTEMPT_WINDOW_SECONDS);
  return consumeSingleRateLimit(
    `${scope}_attempt`,
    `${scope}_attempt:ip:${ip}`,
    IP_ATTEMPT_LIMIT,
    ATTEMPT_WINDOW_SECONDS,
    setup.secret,
    setup.client,
  );
}

export async function consumeSubmissionAttemptUserRateLimit(
  scope: SubmissionScope,
  userId: string,
) {
  const setup = config();
  if (!setup) return { error: true as const };
  return consumeSingleRateLimit(
    `${scope}_attempt`,
    `${scope}_attempt:uid:${userId}`,
    ATTEMPT_LIMIT,
    ATTEMPT_WINDOW_SECONDS,
    setup.secret,
    setup.client,
  );
}

// Keep both word orders available while the routes migrate to the explicit APIs.
export const consumeSubmissionIpAttemptRateLimit =
  consumeSubmissionAttemptIpRateLimit;
export const consumeSubmissionUserAttemptRateLimit =
  consumeSubmissionAttemptUserRateLimit;

/** User-only by default: callers should use the IP helper exactly once per request. */
export function consumeSubmissionAttemptRateLimit(
  request: NextRequest,
  scope: SubmissionScope,
  userId: string,
) {
  return consumeSubmissionAttemptUserRateLimit(scope, userId);
}

export function consumeAdminUploadAttemptRateLimit(
  request: NextRequest,
  userId: string,
) {
  return consumeAdminRateLimit(request, userId);
}

export async function getSubmissionRemaining(
  scope: SubmissionScope,
  userId: string,
) {
  const setup = config();
  if (!setup) return 0;
  const { data, error } = await setup.client.rpc(
    "get_submission_rate_limit_remaining",
    {
      p_scope: scope,
      p_key_hash: hashIdentifier(`${scope}:uid:${userId}`, setup.secret),
      p_limit: DAILY_SUBMISSION_LIMIT,
      p_window_seconds: WINDOW_SECONDS,
    },
  );
  if (error) return 0;
  const value = rowFrom(data)?.remaining;
  return Math.max(0, Math.min(DAILY_SUBMISSION_LIMIT, Number(value) || 0));
}
