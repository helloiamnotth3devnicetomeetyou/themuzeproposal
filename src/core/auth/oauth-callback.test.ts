// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock("@/core/supabase/server", () => ({
  createSupabaseServerClient: mocks.createClient,
}));

import { GET } from "./oauth-callback";

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
    mocks.createClient.mockResolvedValue({
      auth: { exchangeCodeForSession: mocks.exchangeCodeForSession },
    });
  });

  it("redirects missing or failed codes to login without exchanging a session", async () => {
    const missing = await GET(
      new NextRequest("https://themuze.kr/auth/callback?next=/account"),
    );
    expect(missing.headers.get("location")).toBe(
      "https://themuze.kr/login?error=oauth&redirect=%2Faccount",
    );
    expect(mocks.createClient).not.toHaveBeenCalled();

    mocks.exchangeCodeForSession.mockResolvedValueOnce({
      error: new Error("invalid code"),
    });
    const failed = await GET(
      new NextRequest(
        "https://themuze.kr/auth/callback?code=bad&next=/account",
      ),
    );
    expect(failed.headers.get("location")).toBe(
      "https://themuze.kr/login?error=oauth&redirect=%2Faccount",
    );
  });

  it("exchanges the code and redirects only to a safe local path", async () => {
    const response = await GET(
      new NextRequest(
        "https://themuze.kr/auth/callback?code=valid&next=https://attacker.example",
      ),
    );

    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("valid");
    expect(response.headers.get("location")).toBe("https://themuze.kr/");
  });
});
