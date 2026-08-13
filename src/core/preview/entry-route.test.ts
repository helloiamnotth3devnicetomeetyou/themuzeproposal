// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  enable: vi.fn(),
  draftMode: vi.fn(),
  getClaims: vi.fn(),
  createClient: vi.fn(),
  isAdmin: vi.fn(),
}));

vi.mock("next/headers", () => ({
  draftMode: mocks.draftMode,
  cookies: () => ({ set: vi.fn() }),
}));
vi.mock("@/core/auth/admin-auth", () => ({ isAdmin: mocks.isAdmin }));
vi.mock("@/core/supabase/server", () => ({
  createSupabaseServerClient: mocks.createClient,
}));

import { POST } from "./entry-route";

const validToken = "11111111-1111-4111-8111-111111111111";
const request = (
  path: string,
  token = validToken,
  headers: HeadersInit = {},
) => {
  const body = new URLSearchParams({ token, path });
  return new NextRequest("https://themuze.kr/api/admin/preview", {
    method: "POST",
    headers: {
      origin: "https://themuze.kr",
      "content-type": "application/x-www-form-urlencoded",
      ...headers,
    },
    body,
  });
};

describe("POST /api/admin/preview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getClaims.mockResolvedValue({
      data: { claims: { sub: "admin-1" } },
      error: null,
    });
    mocks.createClient.mockResolvedValue({
      auth: { getClaims: mocks.getClaims },
    });
    mocks.isAdmin.mockResolvedValue(true);
    mocks.draftMode.mockResolvedValue({ enable: mocks.enable });
  });

  it("rejects invalid tokens and paths before authentication", async () => {
    expect((await POST(request("/about", "invalid"))).status).toBe(400);
    expect((await POST(request("//attacker.example/about"))).status).toBe(400);
    expect((await POST(request("/admin"))).status).toBe(400);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("rejects cross-origin activation before authentication", async () => {
    expect(
      (
        await POST(
          request("/about", validToken, { origin: "https://attacker.example" }),
        )
      ).status,
    ).toBe(400);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("rejects an oversized preview body before authentication", async () => {
    expect((await POST(request(`/${"a".repeat(17_000)}`))).status).toBe(413);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("requires an authenticated administrator", async () => {
    mocks.getClaims.mockResolvedValueOnce({
      data: null,
      error: new Error("invalid session"),
    });
    expect((await POST(request("/about"))).status).toBe(401);

    mocks.isAdmin.mockResolvedValueOnce(false);
    expect((await POST(request("/about"))).status).toBe(403);
    expect(mocks.enable).not.toHaveBeenCalled();
  });

  it("enables draft mode and redirects only to an allowed local page", async () => {
    const response = await POST(request("/rescene/discography?lang=en"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      `https://themuze.kr/rescene/discography?lang=en&preview=${encodeURIComponent(validToken)}`,
    );
    expect(mocks.enable).toHaveBeenCalledOnce();
  });
});
