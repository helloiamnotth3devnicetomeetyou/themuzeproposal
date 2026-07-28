import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicSupabaseConfig } from "@/core/config/public-env";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 4 * 1024;

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

  const password =
    typeof body === "object" && body && "password" in body
      ? String(body.password)
      : "";

  if (!password || password.length > 1024) return jsonError("INVALID_REQUEST", 400);

  const { url, anonKey } = getPublicSupabaseConfig();

  // Read the authenticated user's email from the server-side session cookie.
  // This prevents an attacker from supplying a different account's email.
  const sessionClient = createServerClient(url, anonKey, {
    cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} },
  });
  const { data: { user } } = await sessionClient.auth.getUser();
  const email = user?.email?.trim().toLowerCase() ?? "";
  if (!email) return jsonError("UNAUTHORIZED", 401);

  const limiterSecret =
    process.env.AUTH_RATE_LIMIT_SECRET?.trim() ||
    (process.env.NODE_ENV === "development" ? anonKey : "");
  if (!limiterSecret) return jsonError("SERVICE_UNAVAILABLE", 503);

  const identifierHash = hashIdentifier(`email:${email}`, limiterSecret);
  const ipHash = hashIdentifier(`ip:${clientIp(request)}`, limiterSecret);
  const limiterClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: rateData, error: rateError } = await limiterClient.rpc(
    "check_login_rate_limit",
    { p_identifier_hash: identifierHash, p_ip_hash: ipHash },
  );
  if (rateError) return jsonError("SERVICE_UNAVAILABLE", 503);

  const rate = Array.isArray(rateData) ? rateData[0] : rateData;
  if (!rate?.is_allowed) {
    return jsonError(
      "RATE_LIMITED",
      429,
      Math.max(1, Number(rate?.retry_after_seconds) || 900),
    );
  }

  // Verify the password using a stateless anon client.
  // We intentionally discard any session the call might produce —
  // the caller's existing session must remain unchanged.
  const verifyClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: authError } = await verifyClient.auth.signInWithPassword({
    email,
    password,
  });
  const succeeded = !authError;

  const { error: recordError } = await limiterClient.rpc(
    "record_login_attempt",
    { p_identifier_hash: identifierHash, p_ip_hash: ipHash, p_succeeded: succeeded },
  );
  if (recordError) return jsonError("SERVICE_UNAVAILABLE", 503);

  if (!succeeded) {
    const isInvalidCredentials =
      authError?.code === "invalid_credentials" ||
      authError?.status === 400;
    return jsonError(
      isInvalidCredentials ? "INVALID_CREDENTIALS" : "SERVICE_UNAVAILABLE",
      isInvalidCredentials ? 401 : 503,
    );
  }

  // No Set-Cookie: the caller's existing session is preserved as-is.
  const response = NextResponse.json({ ok: true });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
