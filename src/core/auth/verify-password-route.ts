import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getPublicSupabaseConfig } from "@/core/config/public-env";
import { clientIp } from "@/core/http/client-ip";
import { isSameOriginRequest } from "@/core/http/same-origin";
import { createServiceRoleClient } from "@/core/supabase/service";

const MAX_BODY_BYTES = 4 * 1024;
const verifyPasswordSchema = z.object({ password: z.string().min(1).max(1024) });

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_REQUEST", 400);
  }

  const parsed = verifyPasswordSchema.safeParse(body);
  if (!parsed.success) return jsonError("INVALID_REQUEST", 400);
  const { password } = parsed.data;

  const { url, anonKey } = getPublicSupabaseConfig();

  // Read the authenticated user's email from the server-side session cookie.
  // This prevents an attacker from supplying a different account's email.
  const sessionClient = createServerClient(url, anonKey, {
    cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} },
  });
  const { data: { user } } = await sessionClient.auth.getUser();
  const email = user?.email?.trim().toLowerCase() ?? "";
  if (!user || !email) return jsonError("UNAUTHORIZED", 401);
  if (!user.identities?.some((identity) => identity.provider === "email")) {
    return jsonError("PASSWORD_UNAVAILABLE", 403);
  }

  const limiterSecret =
    process.env.AUTH_RATE_LIMIT_SECRET?.trim() ||
    (process.env.NODE_ENV === "development" ? anonKey : "");
  if (!limiterSecret) return jsonError("SERVICE_UNAVAILABLE", 503);

  const identifierHash = hashIdentifier(`email:${email}`, limiterSecret);
  const ipHash = hashIdentifier(`ip:${clientIp(request)}`, limiterSecret);
  const limiterClient = createServiceRoleClient();
  if (!limiterClient) return jsonError("SERVICE_UNAVAILABLE", 503);

  const { data: rateData, error: rateError } = await limiterClient.rpc(
    "consume_login_rate_limit",
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

  if (!succeeded) {
    const isInvalidCredentials =
      authError?.code === "invalid_credentials" ||
      authError?.status === 400;
    return jsonError(
      isInvalidCredentials ? "INVALID_CREDENTIALS" : "SERVICE_UNAVAILABLE",
      isInvalidCredentials ? 401 : 503,
    );
  }

  const { error: resetError } = await limiterClient.rpc(
    "reset_login_rate_limit",
    { p_identifier_hash: identifierHash },
  );
  if (resetError) return jsonError("SERVICE_UNAVAILABLE", 503);

  // No Set-Cookie: the caller's existing session is preserved as-is.
  const response = NextResponse.json({ ok: true });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
