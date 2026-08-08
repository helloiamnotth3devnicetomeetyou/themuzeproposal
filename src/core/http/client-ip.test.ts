// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { clientIp } from "./client-ip";

describe("clientIp", () => {
  afterEach(() => { delete process.env.VERCEL; });

  it("only accepts Vercel's sanitized single-value header", () => {
    process.env.VERCEL = "1";
    expect(clientIp(new NextRequest("https://themuze.kr", {
      headers: { "x-vercel-forwarded-for": "203.0.113.4", "x-forwarded-for": "attacker" },
    }))).toBe("203.0.113.4");
  });

  it("does not trust forwarded headers outside Vercel", () => {
    expect(clientIp(new NextRequest("https://themuze.kr", {
      headers: { "x-forwarded-for": "attacker", "x-real-ip": "attacker" },
    }))).toBe("unknown");
  });
});
