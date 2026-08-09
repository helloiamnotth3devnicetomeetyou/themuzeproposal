// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  signInWithPassword: vi.fn(),
  getConfig: vi.fn(),
  createServiceClient: vi.fn(),
  createServerClient: vi.fn(),
}));

vi.mock("@/core/config/public-env", () => ({ getPublicSupabaseConfig: mocks.getConfig }));
vi.mock("@/core/supabase/service", () => ({
  createServiceRoleClient: mocks.createServiceClient,
}));
vi.mock("@supabase/ssr", () => ({ createServerClient: mocks.createServerClient }));

import { POST } from "./password-login-route";

const request = (body: unknown, headers: HeadersInit = {}) => new NextRequest("http://localhost/api/auth/login", {
  method: "POST", headers: { "content-type": "application/json", origin: "http://localhost", ...headers }, body: JSON.stringify(body),
});

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_RATE_LIMIT_SECRET = "test-secret";
    mocks.getConfig.mockReturnValue({ url: "https://project.supabase.co", anonKey: "anon" });
    mocks.createServiceClient.mockReturnValue({ rpc: mocks.rpc });
    mocks.createServerClient.mockImplementation((_url: string, _key: string, options: { cookies: { setAll: (cookies: Array<{ name: string; value: string; options: object }>) => void } }) => ({
      auth: {
        signInWithPassword: mocks.signInWithPassword.mockImplementation(async () => {
          options.cookies.setAll([{ name: "sb-session", value: "token", options: { path: "/" } }]);
          return { error: null };
        }),
      },
    }));
  });

  it("rejects requests without a same-origin Origin header", async () => {
    const missingOrigin = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "user@example.com", password: "password" }),
    });
    const crossOrigin = request(
      { email: "user@example.com", password: "password" },
      { origin: "https://attacker.example" },
    );

    await expect(POST(missingOrigin)).resolves.toMatchObject({ status: 400 });
    await expect(POST(crossOrigin)).resolves.toMatchObject({ status: 400 });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects malformed credentials before calling external services", async () => {
    const response = await POST(request({ email: "not-an-email", password: "" }));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ code: "INVALID_CREDENTIALS" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("returns rate-limit information without attempting authentication", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [{ is_allowed: false, retry_after_seconds: 32 }], error: null });
    const response = await POST(request({ email: "USER@example.com", password: "password" }));
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("32");
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });

  it("returns invalid credentials when Supabase rejects the password", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [{ is_allowed: true }], error: null });
    mocks.signInWithPassword.mockResolvedValueOnce({ error: new Error("invalid") });
    const response = await POST(request({ email: "user@example.com", password: "password" }));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ code: "INVALID_CREDENTIALS" });
  });

  it("returns generic invalid credentials without an identity-provider lookup", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [{ is_allowed: true }], error: null });
    mocks.signInWithPassword.mockResolvedValueOnce({ error: new Error("invalid") });

    const response = await POST(request({ email: "user@example.com", password: "password" }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ code: "INVALID_CREDENTIALS" });
    expect(mocks.rpc).toHaveBeenCalledOnce();
  });

  it("returns a no-store success response and pending session cookies", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [{ is_allowed: true }], error: null }).mockResolvedValueOnce({ data: null, error: null });
    const response = await POST(request({ email: "user@example.com", password: "password" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.cookies.get("sb-session")?.value).toBe("token");
  });

  it("fails closed when the server-only rate limiter client is unavailable", async () => {
    mocks.createServiceClient.mockReturnValueOnce(null);
    const response = await POST(request({ email: "user@example.com", password: "password" }));
    expect(response.status).toBe(503);
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });
});
