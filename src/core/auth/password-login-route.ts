import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicSupabaseConfig } from "@/core/config/public-env";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16 * 1024;

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

function clientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

function hashIdentifier(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > MAX_BODY_BYTES) return jsonError("INVALID_REQUEST", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_REQUEST", 400);
  }

  const email = typeof body === "object" && body && "email" in body
    ? String(body.email).trim().toLowerCase()
    : "";
  const password = typeof body === "object" && body && "password" in body
    ? String(body.password)
    : "";

  if (!email || email.length > 254 || !email.includes("@") || !password || password.length > 1024) {
    return jsonError("INVALID_CREDENTIALS", 401);
  }

  const { url, anonKey } = getPublicSupabaseConfig();
  const limiterSecret = process.env.AUTH_RATE_LIMIT_SECRET?.trim()
    || (process.env.NODE_ENV === "development" ? anonKey : "");
  if (!limiterSecret) return jsonError("SERVICE_UNAVAILABLE", 503);

  const identifierHash = hashIdentifier(`email:${email}`, limiterSecret);
  const ipHash = hashIdentifier(`ip:${clientIp(request)}`, limiterSecret);
  const limiterClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: rateData, error: rateError } = await limiterClient.rpc("check_login_rate_limit", {
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

  const { error: authError } = await authClient.auth.signInWithPassword({ email, password });
  const succeeded = !authError;
  const { error: recordError } = await limiterClient.rpc("record_login_attempt", {
    p_identifier_hash: identifierHash,
    p_ip_hash: ipHash,
    p_succeeded: succeeded,
  });

  if (recordError) return jsonError("SERVICE_UNAVAILABLE", 503);
  if (!succeeded) return jsonError("INVALID_CREDENTIALS", 401);

  const response = NextResponse.json({ ok: true });
  pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  response.headers.set("Cache-Control", "no-store");
  return response;
}
