// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { isLocalDevelopmentRequest } from "./local-development";

const request = (url: string) => new NextRequest(url);

describe("isLocalDevelopmentRequest", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("only allows the fallback on a local development request", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("CI", "");
    expect(isLocalDevelopmentRequest(request("http://localhost/api"))).toBe(
      true,
    );

    vi.stubEnv("VERCEL_ENV", "preview");
    expect(isLocalDevelopmentRequest(request("http://localhost/api"))).toBe(
      false,
    );

    vi.stubEnv("VERCEL_ENV", "");
    expect(
      isLocalDevelopmentRequest(request("https://staging.example/api")),
    ).toBe(false);
  });
});
