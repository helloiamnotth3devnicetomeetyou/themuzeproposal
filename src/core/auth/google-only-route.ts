import { createHmac } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getPublicSupabaseConfig } from "@/core/config/public-env";
import { clientIp } from "@/core/http/client-ip";
import { isSameOriginRequest } from "@/core/http/same-origin";
import { createServiceRoleClient } from "@/core/supabase/service";

const MAX_BODY_BYTES = 4 * 1024;
const emailSchema = z.object({ email: z.string().trim().toLowerCase().email().max(254) });

function jsonError(code: string, status: number, retryAfter?: number) {
  const response = NextResponse.json({ code }, { status });
  response.headers.set("Cache-Control", "no-store");
  if (retryAfter) response.headers.set("Retry-After", String(retryAfter));
  return response;
}

function hashIdentifier(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return jsonError("INVALID_REQUEST", 400);

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > MAX_BODY_BYTES) return jsonError("INVALID_REQUEST", 400);

  const body = await request.json().catch(() => null);
  const parsed = emailSchema.safeParse(body);
  if (!parsed.success) return jsonError("INVALID_REQUEST", 400);

  const { anonKey } = getPublicSupabaseConfig();
  const limiterSecret = process.env.AUTH_RATE_LIMIT_SECRET?.trim()
    || (process.env.NODE_ENV === "development" ? anonKey : "");
  if (!limiterSecret) return jsonError("SERVICE_UNAVAILABLE", 503);

  const { email } = parsed.data;
  const client = createServiceRoleClient();
  if (!client) return jsonError("SERVICE_UNAVAILABLE", 503);

  const { data: rateData, error: rateError } = await client.rpc("consume_login_rate_limit", {
    p_identifier_hash: hashIdentifier(`email:${email}`, limiterSecret),
    p_ip_hash: hashIdentifier(`ip:${clientIp(request)}`, limiterSecret),
  });
  if (rateError) return jsonError("SERVICE_UNAVAILABLE", 503);

  const rate = Array.isArray(rateData) ? rateData[0] : rateData;
  if (!rate?.is_allowed) {
    return jsonError("RATE_LIMITED", 429, Math.max(1, Number(rate?.retry_after_seconds) || 900));
  }

  const { data: googleOnly, error } = await client.rpc("is_google_only_email", { p_email: email });
  if (error) return jsonError("SERVICE_UNAVAILABLE", 503);

  const response = NextResponse.json({ googleOnly: googleOnly === true });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
