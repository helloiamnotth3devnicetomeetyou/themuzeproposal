import { describe, expect, it } from "vitest";
import { autoplayProgress, startSlideTransition } from "./carousel-state";

describe("startSlideTransition", () => {
  it("wraps both directions and keeps the leaving slide", () => {
    expect(startSlideTransition(0, -1, 3)).toEqual({ current: 2, previous: 0 });
    expect(startSlideTransition(2, 3, 3)).toEqual({ current: 0, previous: 2 });
  });

  it("caps autoplay progress at completion", () => {
    expect(autoplayProgress(2_500, 10_000)).toBe(.25);
    expect(autoplayProgress(12_000, 10_000)).toBe(1);
  });
});
