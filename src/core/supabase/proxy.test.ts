// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  getClaims: vi.fn(),
  getPublicSupabaseConfig: vi.fn(() => ({
    url: "https://supabase.example",
    anonKey: "anon-key",
  })),
  isAdmin: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: mocks.createServerClient,
}));
vi.mock("@/core/auth/admin-auth", () => ({ isAdmin: mocks.isAdmin }));
vi.mock("@/core/config/public-env", () => ({
  getPublicSupabaseConfig: mocks.getPublicSupabaseConfig,
}));

import { updateSession } from "./proxy";

describe("updateSession", () => {
  it("preserves the protected URL query in the login redirect", async () => {
    mocks.getClaims.mockResolvedValue({
      data: { claims: {} },
      error: new Error("not signed in"),
    });
    mocks.createServerClient.mockReturnValue({
      auth: { getClaims: mocks.getClaims },
    });

    const response = await updateSession(
      new NextRequest("https://themuze.kr/protect?campaign=summer&step=2"),
    );
    const location = new URL(response.headers.get("location") ?? "");

    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("redirect")).toBe(
      "/protect?campaign=summer&step=2",
    );
  });
});
