import { describe, it, expect } from "vitest";
import { detectSocialPlatform } from "./social-icons";

describe("detectSocialPlatform", () => {
  it("detects instagram URLs", () => {
    expect(detectSocialPlatform("https://instagram.com/themuze")).toBe(
      "instagram",
    );
    expect(detectSocialPlatform("https://www.instagram.com/themuze")).toBe(
      "instagram",
    );
  });

  it("detects youtube URLs", () => {
    expect(detectSocialPlatform("https://youtube.com/channel/abc")).toBe(
      "youtube",
    );
    expect(detectSocialPlatform("https://youtu.be/abc123")).toBe("youtube");
  });

  it("detects x/twitter URLs", () => {
    expect(detectSocialPlatform("https://x.com/themuze")).toBe("x");
    expect(detectSocialPlatform("https://twitter.com/themuze")).toBe("x");
  });

  it("detects tiktok URLs", () => {
    expect(detectSocialPlatform("https://tiktok.com/@themuze")).toBe("tiktok");
  });

  it("detects spotify URLs", () => {
    expect(detectSocialPlatform("https://open.spotify.com/artist/123")).toBe(
      "spotify",
    );
  });

  it("detects weverse URLs", () => {
    expect(detectSocialPlatform("https://weverse.io/rescene")).toBe("weverse");
  });

  it("returns 'other' for unknown URLs", () => {
    expect(detectSocialPlatform("https://example.com")).toBe("other");
  });

  it("returns 'other' for non-http protocols", () => {
    expect(detectSocialPlatform("ftp://instagram.com/abc")).toBe("other");
  });

  it("returns 'other' for invalid URLs", () => {
    expect(detectSocialPlatform("not-a-url")).toBe("other");
    expect(detectSocialPlatform("")).toBe("other");
  });
});
