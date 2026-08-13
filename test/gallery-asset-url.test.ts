import { describe, expect, it } from "vitest";
import { galleryAssetUrl } from "../scripts/gallery-asset-url.mjs";

describe("galleryAssetUrl", () => {
  const r2PublicUrl = "https://cdn.example.com";

  it("accepts only this project's public artist-assets URLs", () => {
    expect(
      galleryAssetUrl(
        "https://cdn.example.com/artist-assets/a.webp",
        r2PublicUrl,
      ).href,
    ).toContain("artist-assets/a.webp");
    expect(() =>
      galleryAssetUrl("http://169.254.169.254/latest/meta-data", r2PublicUrl),
    ).toThrow("untrusted gallery image URL");
    expect(() =>
      galleryAssetUrl(
        "https://cdn.example.com/album-covers/a.webp",
        r2PublicUrl,
      ),
    ).toThrow("untrusted gallery image URL");
  });
});
