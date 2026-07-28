// @vitest-environment node
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { isSameOriginRequest } from "./same-origin";

describe("isSameOriginRequest", () => {
  it("accepts the exact request origin", () => {
    const request = new NextRequest("https://themuze.kr/api/auth/login", {
      headers: { origin: "https://themuze.kr" },
    });
    expect(isSameOriginRequest(request)).toBe(true);
  });

  it("rejects missing, malformed, and cross-site origins", () => {
    expect(isSameOriginRequest(new NextRequest("https://themuze.kr/api/auth/login"))).toBe(false);
    expect(isSameOriginRequest(new NextRequest("https://themuze.kr/api/auth/login", {
      headers: { origin: "not a url" },
    }))).toBe(false);
    expect(isSameOriginRequest(new NextRequest("https://themuze.kr/api/auth/login", {
      headers: { origin: "https://attacker.example" },
    }))).toBe(false);
  });
});
