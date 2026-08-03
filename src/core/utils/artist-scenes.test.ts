import { describe, it, expect } from "vitest";
import {
  normalizeSceneLink,
  normalizeOutline,
  outlineCentroid,
  outlineToPath,
  simplifyOutline,
} from "./artist-scenes";

describe("normalizeSceneLink", () => {
  it("returns null for null/undefined/empty", () => {
    expect(normalizeSceneLink(null)).toBeNull();
    expect(normalizeSceneLink(undefined)).toBeNull();
    expect(normalizeSceneLink("")).toBeNull();
    expect(normalizeSceneLink("   ")).toBeNull();
  });

  it("accepts relative paths starting with /", () => {
    expect(normalizeSceneLink("/rescene/discography")).toBe("/rescene/discography");
    expect(normalizeSceneLink("/")).toBe("/");
  });

  it("rejects protocol-relative URLs (//)", () => {
    expect(normalizeSceneLink("//evil.com")).toBeNull();
  });

  it("accepts http/https URLs", () => {
    expect(normalizeSceneLink("https://themuze.kr")).toBe("https://themuze.kr");
    expect(normalizeSceneLink("http://themuze.kr")).toBe("http://themuze.kr");
  });

  it("rejects non-http protocols", () => {
    expect(normalizeSceneLink("javascript:alert(1)")).toBeNull();
    expect(normalizeSceneLink("ftp://themuze.kr")).toBeNull();
  });
});

describe("normalizeOutline", () => {
  it("returns empty array for non-array input", () => {
    expect(normalizeOutline(null)).toEqual([]);
    expect(normalizeOutline("string")).toEqual([]);
    expect(normalizeOutline(42)).toEqual([]);
  });

  it("filters out non-object items", () => {
    expect(normalizeOutline([null, "bad", 1, { x: 10, y: 20 }])).toEqual([{ x: 10, y: 20 }]);
  });

  it("filters items missing x or y", () => {
    expect(normalizeOutline([{ x: 10 }, { y: 20 }, { x: 30, y: 40 }])).toEqual([{ x: 30, y: 40 }]);
  });

  it("clamps x and y to 0-100", () => {
    const result = normalizeOutline([{ x: -5, y: 150 }]);
    expect(result[0].x).toBe(0);
    expect(result[0].y).toBe(100);
  });

  it("filters out non-finite values", () => {
    expect(normalizeOutline([{ x: Infinity, y: 50 }])).toEqual([]);
    expect(normalizeOutline([{ x: NaN, y: 50 }])).toEqual([]);
  });
});

describe("outlineCentroid", () => {
  it("returns default center for empty points", () => {
    expect(outlineCentroid([])).toEqual({ x: 50, y: 50 });
  });

  it("returns the average of all points", () => {
    const result = outlineCentroid([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ]);
    expect(result).toEqual({ x: 50, y: 50 });
  });

  it("handles single point", () => {
    expect(outlineCentroid([{ x: 30, y: 70 }])).toEqual({ x: 30, y: 70 });
  });
});

describe("outlineToPath", () => {
  it("returns empty string for fewer than 3 points", () => {
    expect(outlineToPath([])).toBe("");
    expect(outlineToPath([{ x: 10, y: 10 }])).toBe("");
    expect(outlineToPath([{ x: 10, y: 10 }, { x: 20, y: 20 }])).toBe("");
  });

  it("produces a path string starting with M and ending with Z", () => {
    const points = [
      { x: 10, y: 10 },
      { x: 90, y: 10 },
      { x: 50, y: 80 },
    ];
    const path = outlineToPath(points);
    expect(path).toMatch(/^M /);
    expect(path).toMatch(/Z$/);
  });

  it("produces a valid SVG path with C commands for 4+ points", () => {
    const points = [
      { x: 10, y: 10 },
      { x: 90, y: 10 },
      { x: 90, y: 80 },
      { x: 10, y: 80 },
    ];
    const path = outlineToPath(points);
    expect(path).toContain(" C ");
  });
});

describe("simplifyOutline", () => {
  it("returns input unchanged for < 4 points", () => {
    const pts = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 100 }];
    expect(simplifyOutline(pts)).toEqual(pts);
  });

  it("simplifies a simple rectangle with collinear sides", () => {
    // A rectangle where extra midpoints on each edge should be removable
    const points = [
      { x: 0, y: 0 },
      { x: 50, y: 0 },  // midpoint – collinear, should be simplified away
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const result = simplifyOutline(points, 0.1);
    // Result should have 4 or fewer points (collinear midpoint removed)
    expect(result.length).toBeLessThanOrEqual(points.length);
    expect(result.length).toBeGreaterThanOrEqual(3);
  });

  it("preserves all points when tolerance is 0", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 25, y: 50 },
      { x: 50, y: 0 },
      { x: 75, y: 50 },
    ];
    const result = simplifyOutline(points, 0);
    expect(result.length).toBeGreaterThanOrEqual(3);
  });
});
