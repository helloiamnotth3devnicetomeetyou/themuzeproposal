// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getConfig: vi.fn(),
  createServiceClient: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/core/config/public-env", () => ({ getPublicSupabaseConfig: mocks.getConfig }));
vi.mock("@/core/supabase/service", () => ({ createServiceRoleClient: mocks.createServiceClient }));

import { POST } from "./google-only-route";

const request = (body: unknown, headers: HeadersInit = {}) => new NextRequest("http://localhost/api/auth/google-only", {
  method: "POST",
  headers: { "content-type": "application/json", origin: "http://localhost", ...headers },
  body: JSON.stringify(body),
});

describe("POST /api/auth/google-only", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_RATE_LIMIT_SECRET = "test-secret";
    mocks.getConfig.mockReturnValue({ anonKey: "anon" });
    mocks.createServiceClient.mockReturnValue({ rpc: mocks.rpc });
  });

  it("returns the Google-only result after applying the login rate limit", async () => {
    mocks.rpc
      .mockResolvedValueOnce({ data: [{ is_allowed: true }], error: null })
      .mockResolvedValueOnce({ data: true, error: null });

    const response = await POST(request({ email: "USER@example.com" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ googleOnly: true });
    expect(mocks.rpc).toHaveBeenNthCalledWith(2, "is_google_only_email", { p_email: "user@example.com" });
  });

  it("rejects cross-origin requests before checking an account", async () => {
    const response = await POST(request({ email: "user@example.com" }, { origin: "https://attacker.example" }));

    expect(response.status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("does not reveal a provider after the rate limit is exhausted", async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: [{ is_allowed: false, retry_after_seconds: 60 }],
      error: null,
    });

    const response = await POST(request({ email: "user@example.com" }));

    expect(response.status).toBe(429);
    expect(mocks.rpc).toHaveBeenCalledOnce();
  });
});
