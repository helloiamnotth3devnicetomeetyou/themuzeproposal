// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  signInWithPassword: vi.fn(),
  getUser: vi.fn(),
  getConfig: vi.fn(),
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
  createServerClient: vi.fn(),
}));

vi.mock("@/core/config/public-env", () => ({
  getPublicSupabaseConfig: mocks.getConfig,
}));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }));
vi.mock("@/core/supabase/service", () => ({
  createServiceRoleClient: mocks.createServiceClient,
}));
vi.mock("@supabase/ssr", () => ({
  createServerClient: mocks.createServerClient,
}));

import { POST } from "./verify-password-route";

const request = (body: Record<string, unknown>, headers: HeadersInit = {}) =>
  new NextRequest("http://localhost/api/auth/verify-password", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      ...headers,
    },
    body: JSON.stringify({ turnstileToken: "test-turnstile-token", ...body }),
  });

describe("POST /api/auth/verify-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_RATE_LIMIT_SECRET = "test-secret";
    mocks.getConfig.mockReturnValue({
      url: "https://project.supabase.co",
      anonKey: "anon",
    });

    // Session client: returns authenticated user
    mocks.createServerClient.mockReturnValue({
      auth: {
        getUser: mocks.getUser.mockResolvedValue({
          data: {
            user: {
              email: "user@example.com",
              identities: [{ provider: "email" }],
            },
          },
        }),
      },
    });

    mocks.createServiceClient.mockReturnValue({ rpc: mocks.rpc });

    // Stateless anon client: verifies the submitted password.
    mocks.createClient.mockReturnValue({
      auth: { signInWithPassword: mocks.signInWithPassword },
    });
  });

  it("rejects requests with a missing or empty password", async () => {
    const response = await POST(request({ password: "" }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ code: "INVALID_REQUEST" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects cross-origin requests before reading the session", async () => {
    const response = await POST(
      request(
        { password: "somepassword" },
        { origin: "https://attacker.example" },
      ),
    );
    expect(response.status).toBe(400);
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });

  it("returns 401 UNAUTHORIZED when no session is present", async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null } });
    const response = await POST(request({ password: "somepassword" }));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ code: "UNAUTHORIZED" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects password checks for Google-only accounts", async () => {
    mocks.getUser.mockResolvedValueOnce({
      data: {
        user: {
          email: "user@example.com",
          identities: [{ provider: "google" }],
        },
      },
    });

    const response = await POST(request({ password: "somepassword" }));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      code: "PASSWORD_UNAVAILABLE",
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("returns rate-limit information without attempting authentication", async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: [{ is_allowed: false, retry_after_seconds: 60 }],
      error: null,
    });
    const response = await POST(request({ password: "somepassword" }));
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });

  it("returns INVALID_CREDENTIALS when Supabase rejects the password", async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: [{ is_allowed: true }],
      error: null,
    });
    mocks.signInWithPassword.mockResolvedValueOnce({
      error: { code: "invalid_credentials", status: 400 },
    });
    const response = await POST(request({ password: "wrongpassword" }));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      code: "INVALID_CREDENTIALS",
    });
  });

  it("returns 200 with no Set-Cookie header on success", async () => {
    mocks.rpc
      .mockResolvedValueOnce({ data: [{ is_allowed: true }], error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    mocks.signInWithPassword.mockResolvedValueOnce({ error: null });
    const response = await POST(request({ password: "correctpassword" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    // Must not issue a new session cookie
    expect(response.headers.get("set-cookie")).toBeNull();
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("uses the email from the session cookie, not from the request body", async () => {
    mocks.rpc
      .mockResolvedValueOnce({ data: [{ is_allowed: true }], error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    mocks.signInWithPassword.mockResolvedValueOnce({ error: null });

    // Request body has no email field — the route must derive it from the session
    await POST(request({ password: "correctpassword" }));

    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "correctpassword",
      options: { captchaToken: "test-turnstile-token" },
    });
  });

  it("returns CAPTCHA_FAILED without leaking it as an invalid-credentials error", async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: [{ is_allowed: true }],
      error: null,
    });
    mocks.signInWithPassword.mockResolvedValueOnce({
      error: { code: "captcha_failed", status: 400 },
    });
    const response = await POST(request({ password: "correctpassword" }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ code: "CAPTCHA_FAILED" });
  });

  it("fails closed when the server-only rate limiter client is unavailable", async () => {
    mocks.createServiceClient.mockReturnValueOnce(null);
    const response = await POST(request({ password: "somepassword" }));
    expect(response.status).toBe(503);
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });

  it("fails closed in production when client IP is unavailable", async () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.TRUSTED_CLIENT_IP_HEADER;

    const response = await POST(request({ password: "somepassword" }));

    expect(response.status).toBe(503);
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
