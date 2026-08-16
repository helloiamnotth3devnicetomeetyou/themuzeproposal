// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({ updateSession: vi.fn() }));
vi.mock("@/core/supabase/proxy", () => ({
  updateSession: mocks.updateSession,
}));

import { proxy } from "./proxy";

describe("proxy security headers", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
  });

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
    expect(policy).toContain(
      "connect-src 'self' https://project.supabase.co;",
    );
    expect(policy).not.toMatch(/connect-src 'self' https:(?:\s|;)/);
    expect(policy).not.toContain("wss://ws-us3.pusher.com");
  });

  it("allows the preview toolbar websocket only in Vercel previews", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    mocks.updateSession.mockResolvedValue(new NextResponse(null));

    const response = await proxy(new NextRequest("https://themuze.kr/admin"));
    const policy = response.headers.get("content-security-policy") ?? "";

    expect(policy).toContain(
      "connect-src 'self' https://project.supabase.co wss://ws-us3.pusher.com;",
    );
  });

  it("protects admin path segments without matching similar public paths", async () => {
    mocks.updateSession.mockResolvedValue(new NextResponse(null));

    await proxy(new NextRequest("https://themuze.kr/admin/settings"));
    expect(mocks.updateSession).toHaveBeenCalledTimes(1);

    mocks.updateSession.mockClear();
    await proxy(new NextRequest("https://themuze.kr/administrator"));
    expect(mocks.updateSession).not.toHaveBeenCalled();
  });
});
