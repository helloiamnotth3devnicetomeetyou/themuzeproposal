import { describe, expect, it } from "vitest";
import {
  getGuideHighlightRect,
  getGuidePosition,
  getSnappedGuidePosition,
  shouldRevealGuideTarget,
} from "./guide-position";

describe("admin guide positioning", () => {
  const viewport = { width: 1200, height: 800 };
  const popover = { width: 360, height: 320 };

  it("places the guide beside the target when space is available", () => {
    expect(
      getGuidePosition(
        { top: 200, left: 200, width: 160, height: 60 },
        popover,
        viewport,
      ),
    ).toMatchObject({ placement: "right", left: 374 });
    expect(
      getGuidePosition(
        { top: 200, left: 1000, width: 120, height: 60 },
        popover,
        viewport,
      ),
    ).toMatchObject({ placement: "left", left: 626 });
  });

  it("uses vertical space when neither side is wide enough", () => {
    expect(
      getGuidePosition(
        { top: 120, left: 340, width: 220, height: 60 },
        popover,
        { width: 900, height: 900 },
      ).placement,
    ).toBe("below");
    expect(
      getGuidePosition(
        { top: 720, left: 340, width: 220, height: 60 },
        popover,
        { width: 900, height: 900 },
      ).placement,
    ).toBe("above");
  });

  it("keeps highlights and guide cards inside the viewport", () => {
    expect(
      getGuideHighlightRect(
        { top: -20, left: -40, width: 200, height: 100 },
        viewport,
      ),
    ).toEqual({ top: 8, left: 8, width: 160, height: 80 });
    const position = getGuidePosition(
      { top: 760, left: 1160, width: 80, height: 80 },
      popover,
      viewport,
    );
    expect(position.top).toBeGreaterThanOrEqual(16);
    expect(position.left).toBeGreaterThanOrEqual(16);
    expect(position.top + popover.height).toBeLessThanOrEqual(784);
    expect(position.left + popover.width).toBeLessThanOrEqual(1184);

    const compact = getGuidePosition(
      { top: 220, left: 120, width: 80, height: 40 },
      { width: 288, height: 420 },
      { width: 320, height: 480 },
    );
    expect(compact.left).toBe(16);
    expect(compact.top).toBeGreaterThanOrEqual(16);
    expect(compact.top + 420).toBeLessThanOrEqual(464);
  });

  it("reveals targets that are covered even when they are inside the viewport", () => {
    const target = { top: 200, left: 200, width: 160, height: 60 };
    expect(shouldRevealGuideTarget(target, viewport, true)).toBe(false);
    expect(shouldRevealGuideTarget(target, viewport, false)).toBe(true);
  });

  it("snaps a dragged guide card to nearby screen edges", () => {
    expect(
      getSnappedGuidePosition({ top: 20, left: 830 }, popover, viewport),
    ).toEqual({ top: 12, left: 828 });
    expect(
      getSnappedGuidePosition({ top: 300, left: 400 }, popover, viewport),
    ).toEqual({ top: 300, left: 400 });
  });
});
