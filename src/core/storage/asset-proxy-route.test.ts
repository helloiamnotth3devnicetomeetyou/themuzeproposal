// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./asset-proxy-route";
import { managedAssetFromUrl } from "./public-url";

describe("GET /api/asset-proxy", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("rejects malformed managed URLs as invalid requests", async () => {
    vi.stubEnv("NEXT_PUBLIC_R2_PUBLIC_URL", "https://cdn.example.com");
    const url = "https://cdn.example.com/track-assets/%";

    const response = await GET(new NextRequest(`https://themuze.kr/api/asset-proxy?url=${encodeURIComponent(url)}`));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ code: "INVALID_REQUEST" });
  });

  it("rejects encoded separators and control characters", () => {
    vi.stubEnv("NEXT_PUBLIC_R2_PUBLIC_URL", "https://cdn.example.com");

    expect(managedAssetFromUrl("https://cdn.example.com/track-assets%2Fpath/file.jpg")).toBeNull();
    expect(managedAssetFromUrl("https://cdn.example.com/track-assets/path%00file.jpg")).toBeNull();
  });
});
