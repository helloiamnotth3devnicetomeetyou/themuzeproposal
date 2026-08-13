// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({ updateSession: vi.fn() }));
vi.mock("@/core/supabase/proxy", () => ({
  updateSession: mocks.updateSession,
}));

import { proxy } from "./proxy";

describe("proxy security headers", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("passes a nonce-bearing CSP to protected requests and responses", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.updateSession.mockResolvedValue(new NextResponse(null));

    const response = await proxy(new NextRequest("https://themuze.kr/admin"));
    const forwarded = mocks.updateSession.mock.calls[0][0] as NextRequest;
    const policy = response.headers.get("content-security-policy") ?? "";

    expect(forwarded.headers.get("x-nonce")).toBeTruthy();
    expect(forwarded.headers.get("content-security-policy")).toBe(policy);
    expect(policy).toContain("media-src 'self' blob: https:");
    expect(policy).toContain(
      "style-src 'self'; style-src-attr 'unsafe-inline'",
    );
    expect(policy).toMatch(/script-src 'self' 'nonce-[^']+'/);
  });
});
