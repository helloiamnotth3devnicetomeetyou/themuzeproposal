import { describe, expect, it } from "vitest";
import { getSquareCrop } from "./square-image-crop";

describe("getSquareCrop", () => {
  it("keeps a square crop inside the source while zooming and positioning", () => {
    expect(getSquareCrop(1200, 800, 1, 0, 0)).toEqual({
      x: 200,
      y: 0,
      size: 800,
    });
    expect(getSquareCrop(1200, 800, 2, 100, -100)).toEqual({
      x: 800,
      y: 0,
      size: 400,
    });
  });
});
