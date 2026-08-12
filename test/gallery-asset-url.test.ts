import { describe, expect, it } from "vitest";
import { galleryAssetUrl } from "../scripts/gallery-asset-url.mjs";

describe("galleryAssetUrl", () => {
  const storageUrl = "https://project.supabase.co";

  it("accepts only this project's public artist-assets URLs", () => {
    expect(galleryAssetUrl("https://project.supabase.co/storage/v1/object/public/artist-assets/a.webp", storageUrl).href).toContain("artist-assets/a.webp");
    expect(() => galleryAssetUrl("http://169.254.169.254/latest/meta-data", storageUrl)).toThrow("untrusted gallery image URL");
    expect(() => galleryAssetUrl("https://project.supabase.co/storage/v1/object/public/album-covers/a.webp", storageUrl)).toThrow("untrusted gallery image URL");
  });
});
