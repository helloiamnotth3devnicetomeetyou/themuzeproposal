// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  signInWithPassword: vi.fn(),
  getConfig: vi.fn(),
  createClient: vi.fn(),
  createServerClient: vi.fn(),
}));

vi.mock("@/core/config/public-env", () => ({ getPublicSupabaseConfig: mocks.getConfig }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }));
vi.mock("@supabase/ssr", () => ({ createServerClient: mocks.createServerClient }));

import { POST } from "./password-login-route";

const request = (body: unknown, headers: HeadersInit = {}) => new NextRequest("http://localhost/api/auth/login", {
  method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body),
});

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_RATE_LIMIT_SECRET = "test-secret";
    mocks.getConfig.mockReturnValue({ url: "https://project.supabase.co", anonKey: "anon" });
    mocks.createClient.mockReturnValue({ rpc: mocks.rpc });
    mocks.createServerClient.mockImplementation((_url: string, _key: string, options: { cookies: { setAll: (cookies: Array<{ name: string; value: string; options: object }>) => void } }) => ({
      auth: {
        signInWithPassword: mocks.signInWithPassword.mockImplementation(async () => {
          options.cookies.setAll([{ name: "sb-session", value: "token", options: { path: "/" } }]);
          return { error: null };
        }),
      },
    }));
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
    mocks.rpc.mockResolvedValueOnce({ data: [{ is_allowed: true }], error: null }).mockResolvedValueOnce({ data: null, error: null });
    mocks.signInWithPassword.mockResolvedValueOnce({ error: new Error("invalid") });
    const response = await POST(request({ email: "user@example.com", password: "password" }));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ code: "INVALID_CREDENTIALS" });
  });

  it("returns a no-store success response and pending session cookies", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [{ is_allowed: true }], error: null }).mockResolvedValueOnce({ data: null, error: null });
    const response = await POST(request({ email: "user@example.com", password: "password" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.cookies.get("sb-session")?.value).toBe("token");
  });
});
