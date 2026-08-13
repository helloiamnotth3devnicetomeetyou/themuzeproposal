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

    const response = await GET(
      new NextRequest(
        `https://themuze.kr/api/asset-proxy?url=${encodeURIComponent(url)}`,
      ),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ code: "INVALID_REQUEST" });
  });

  it("rejects encoded separators and control characters", () => {
    vi.stubEnv("NEXT_PUBLIC_R2_PUBLIC_URL", "https://cdn.example.com");

    expect(
      managedAssetFromUrl(
        "https://cdn.example.com/track-assets%2Fpath/file.jpg",
      ),
    ).toBeNull();
    expect(
      managedAssetFromUrl(
        "https://cdn.example.com/track-assets/path%00file.jpg",
      ),
    ).toBeNull();
    expect(
      managedAssetFromUrl(
        "https://cdn.example.com/track-assets/%252e%252e/other/file.jpg",
      ),
    ).toBeNull();
    expect(
      managedAssetFromUrl("https://cdn.example.com/track-assets/../file.jpg"),
    ).toBeNull();
    expect(
      managedAssetFromUrl("https://cdn.example.com/track-assets/path/file.jpg"),
    ).toEqual({ bucket: "track-assets", path: "path/file.jpg" });
  });

  it("proxies bounded artist SVGs and images", async () => {
    vi.stubEnv("NEXT_PUBLIC_R2_PUBLIC_URL", "https://cdn.example.com");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("<svg xmlns=\"http://www.w3.org/2000/svg\" />", {
          headers: {
            "content-type": "image/svg+xml",
          },
        }),
      ),
    );
    const url =
      "https://cdn.example.com/artist-assets/artist/album-typography-sanitized/album/123e4567-e89b-12d3-a456-426614174000.svg";
    const response = await GET(
      new NextRequest(
        `https://themuze.kr/api/asset-proxy?url=${encodeURIComponent(url)}`,
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/svg+xml");
    await expect(response.text()).resolves.toContain("<svg");
  });

  it("proxies artist images", async () => {
    vi.stubEnv("NEXT_PUBLIC_R2_PUBLIC_URL", "https://cdn.example.com");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(new Uint8Array([1]), {
          headers: { "content-type": "image/webp" },
        }),
      ),
    );
    const url = "https://cdn.example.com/artist-assets/artist/profile/image.webp";
    const response = await GET(
      new NextRequest(
        `https://themuze.kr/api/asset-proxy?url=${encodeURIComponent(url)}`,
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
  });
});
