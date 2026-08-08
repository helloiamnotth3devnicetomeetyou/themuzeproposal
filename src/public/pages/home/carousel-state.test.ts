import { describe, expect, it } from "vitest";
import { startSlideTransition } from "./carousel-state";

describe("startSlideTransition", () => {
  it("wraps both directions and keeps the leaving slide", () => {
    expect(startSlideTransition(0, -1, 3)).toEqual({ current: 2, previous: 0 });
    expect(startSlideTransition(2, 3, 3)).toEqual({ current: 0, previous: 2 });
  });
});
