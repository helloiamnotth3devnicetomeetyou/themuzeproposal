import { afterEach, describe, expect, it, vi } from "vitest";
import { preloadImages } from "./image-preload";

describe("preloadImages", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("limits concurrent requests and applies responsive image hints", async () => {
    let active = 0;
    let maximumActive = 0;
    const requested: Array<{ src: string; srcset: string; sizes: string }> = [];

    class MockImage {
      decoding = "";
      sizes = "";
      srcset = "";
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(value: string) {
        active += 1;
        maximumActive = Math.max(maximumActive, active);
        requested.push({ src: value, srcset: this.srcset, sizes: this.sizes });
        window.setTimeout(() => {
          active -= 1;
          this.onload?.();
        }, 0);
      }
    }

    vi.stubGlobal("Image", MockImage);

    await preloadImages([
      { src: "/cover-a.jpg", srcSet: "/cover-a-640.jpg 640w", sizes: "440px" },
      { src: "/cover-b.jpg" },
      { src: "/cover-c.jpg" },
    ], { concurrency: 2 });

    expect(maximumActive).toBe(2);
    expect(requested).toHaveLength(3);
    expect(requested[0]).toEqual({
      src: "/cover-a.jpg",
      srcset: "/cover-a-640.jpg 640w",
      sizes: "440px",
    });
  });

  it("deduplicates the same image candidate", async () => {
    let requests = 0;

    class MockImage {
      decoding = "";
      sizes = "";
      srcset = "";
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        requests += 1;
        queueMicrotask(() => this.onload?.());
      }
    }

    vi.stubGlobal("Image", MockImage);
    const candidate = { src: "/dedupe-cover.jpg", sizes: "440px" };

    await Promise.all([
      preloadImages([candidate]),
      preloadImages([candidate]),
    ]);

    expect(requests).toBe(1);
  });
});

