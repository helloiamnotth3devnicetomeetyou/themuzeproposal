import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOGIN_SLIDES,
  MAX_LOGIN_SLIDES,
  normalizeLoginSlides,
} from "./login-slides";

describe("normalizeLoginSlides", () => {
  it("keeps valid unique slides within the login limit", () => {
    const slides = normalizeLoginSlides(
      Array.from({ length: MAX_LOGIN_SLIDES + 1 }, (_, index) => ({
        id: `slide-${index}`,
        imageUrl: `https://assets.example/${index}.webp`,
        title: `Slide ${index}`,
        source: "album-cover",
      })),
    );

    expect(slides).toHaveLength(MAX_LOGIN_SLIDES);
    expect(slides[0]?.imageUrl).toBe("https://assets.example/0.webp");
  });

  it("falls back when every stored slide is invalid or duplicated", () => {
    expect(
      normalizeLoginSlides([
        { imageUrl: "not-an-image", title: "Bad", source: "album-cover" },
        { imageUrl: "/same.webp", title: "One", source: "album-cover" },
        { imageUrl: "/same.webp", title: "Two", source: "album-cover" },
      ]),
    ).toEqual([
      { id: "login-slide-1", imageUrl: "/same.webp", title: "One", source: "album-cover" },
    ]);
    expect(normalizeLoginSlides([])).toEqual(DEFAULT_LOGIN_SLIDES);
  });
});
