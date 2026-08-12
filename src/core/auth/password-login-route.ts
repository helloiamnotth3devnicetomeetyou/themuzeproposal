import { createHmac } from "node:crypto";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getPublicSupabaseConfig } from "@/core/config/public-env";
import { clientIp } from "@/core/http/client-ip";
import { parseJsonWithinLimit } from "@/core/http/request-body";
import { isSameOriginRequest } from "@/core/http/same-origin";
import { createServiceRoleClient } from "@/core/supabase/service";

const MAX_BODY_BYTES = 16 * 1024;
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(1024),
  turnstileToken: z.string().min(1).max(4096),
});

type PendingCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

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

  let body: unknown;
  try {
    body = await parseJsonWithinLimit(request, MAX_BODY_BYTES);
  } catch {
    return jsonError("INVALID_REQUEST", 400);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("INVALID_CREDENTIALS", 401);
  }
  const { email, password, turnstileToken } = parsed.data;

  const { url, anonKey } = getPublicSupabaseConfig();
  const limiterSecret = process.env.AUTH_RATE_LIMIT_SECRET?.trim()
    || (process.env.NODE_ENV === "development" ? anonKey : "");
  if (!limiterSecret) return jsonError("SERVICE_UNAVAILABLE", 503);

  const requestIp = clientIp(request);
  if (!requestIp && process.env.NODE_ENV !== "development") {
    return jsonError("SERVICE_UNAVAILABLE", 503);
  }
  const limiterIp = requestIp ?? "development";
  const identifierHash = hashIdentifier(`email:${email}`, limiterSecret);
  const ipHash = hashIdentifier(`ip:${limiterIp}`, limiterSecret);
  const limiterClient = createServiceRoleClient();
  if (!limiterClient) return jsonError("SERVICE_UNAVAILABLE", 503);

  const { data: rateData, error: rateError } = await limiterClient.rpc("consume_login_rate_limit", {
    p_identifier_hash: identifierHash,
    p_ip_hash: ipHash,
  });
  if (rateError) return jsonError("SERVICE_UNAVAILABLE", 503);

  const rate = Array.isArray(rateData) ? rateData[0] : rateData;
  if (!rate?.is_allowed) {
    return jsonError("RATE_LIMITED", 429, Math.max(1, Number(rate?.retry_after_seconds) || 900));
  }

  const pendingCookies: PendingCookie[] = [];
  const authClient = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        pendingCookies.push(...cookiesToSet);
      },
    },
  });

  const { error: authError } = await authClient.auth.signInWithPassword({
    email,
    password,
    options: { captchaToken: turnstileToken },
  });
  const succeeded = !authError;
  if (!succeeded) return jsonError("INVALID_CREDENTIALS", 401);

  const { error: resetError } = await limiterClient.rpc("reset_login_rate_limit", {
    p_identifier_hash: identifierHash,
  });
  if (resetError) return jsonError("SERVICE_UNAVAILABLE", 503);

  const response = NextResponse.json({ ok: true });
  pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  response.headers.set("Cache-Control", "no-store");
  return response;
}
