// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { clientIp } from "./client-ip";

describe("clientIp", () => {
  afterEach(() => {
    delete process.env.VERCEL;
    delete process.env.TRUSTED_CLIENT_IP_HEADER;
  });

  it("only accepts Vercel's sanitized single-value header", () => {
    process.env.VERCEL = "1";
    expect(
      clientIp(
        new NextRequest("https://themuze.kr", {
          headers: {
            "x-vercel-forwarded-for": "203.0.113.4",
            "x-forwarded-for": "attacker",
          },
        }),
      ),
    ).toBe("203.0.113.4");
  });

  it("allows a configured trusted proxy to override Vercel's edge IP", () => {
    process.env.VERCEL = "1";
    process.env.TRUSTED_CLIENT_IP_HEADER = "cf-connecting-ip";
    expect(
      clientIp(
        new NextRequest("https://themuze.kr", {
          headers: {
            "cf-connecting-ip": "203.0.113.8",
            "x-vercel-forwarded-for": "198.51.100.2",
          },
        }),
      ),
    ).toBe("203.0.113.8");
  });

  it("does not trust forwarded headers outside Vercel", () => {
    expect(
      clientIp(
        new NextRequest("https://themuze.kr", {
          headers: { "x-forwarded-for": "attacker", "x-real-ip": "attacker" },
        }),
      ),
    ).toBeNull();
  });

  it("accepts one explicitly configured proxy-sanitized header", () => {
    process.env.TRUSTED_CLIENT_IP_HEADER = "x-real-ip";
    expect(
      clientIp(
        new NextRequest("https://themuze.kr", {
          headers: { "x-real-ip": "203.0.113.8" },
        }),
      ),
    ).toBe("203.0.113.8");
  });
});
