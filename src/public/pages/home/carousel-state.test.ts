import { describe, expect, it } from "vitest";
import { autoplayProgress, startSlideTransition, swipeSlideOffset } from "./carousel-state";

describe("startSlideTransition", () => {
  it("wraps both directions and keeps the leaving slide", () => {
    expect(startSlideTransition(0, -1, 3)).toEqual({ current: 2, previous: 0, direction: -1 });
    expect(startSlideTransition(2, 3, 3)).toEqual({ current: 0, previous: 2, direction: 1 });
  });

  it("caps autoplay progress at completion", () => {
    expect(autoplayProgress(2_500, 10_000)).toBe(.25);
    expect(autoplayProgress(12_000, 10_000)).toBe(1);
  });

  it("turns deliberate horizontal swipes into the matching slide offset", () => {
    expect(swipeSlideOffset(200, 120)).toBe(1);
    expect(swipeSlideOffset(120, 200)).toBe(-1);
    expect(swipeSlideOffset(200, 170)).toBe(0);
  });
});
