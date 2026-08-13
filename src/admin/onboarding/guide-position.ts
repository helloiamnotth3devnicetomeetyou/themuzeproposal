export type GuideRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};
export type GuidePlacement = "right" | "left" | "below" | "above";
export type GuidePosition = {
  top: number;
  left: number;
  placement: GuidePlacement;
};

const VIEWPORT_GUTTER = 16;
const TARGET_GAP = 14;
const HIGHLIGHT_PADDING = 8;
const SAFE_TARGET_MARGIN = 24;
const DRAG_GUTTER = 12;
const SNAP_DISTANCE = 36;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

export function getSnappedGuidePosition(
  position: { top: number; left: number },
  popover: { width: number; height: number },
  viewport: { width: number; height: number },
) {
  const maxLeft = Math.max(
    DRAG_GUTTER,
    viewport.width - popover.width - DRAG_GUTTER,
  );
  const maxTop = Math.max(
    DRAG_GUTTER,
    viewport.height - popover.height - DRAG_GUTTER,
  );
  const snap = (value: number, max: number) =>
    value - DRAG_GUTTER < SNAP_DISTANCE
      ? DRAG_GUTTER
      : max - value < SNAP_DISTANCE
        ? max
        : clamp(value, DRAG_GUTTER, max);
  return {
    top: snap(position.top, maxTop),
    left: snap(position.left, maxLeft),
  };
}

export function shouldRevealGuideTarget(
  target: GuideRect,
  viewport: { width: number; height: number },
  isExposed: boolean,
) {
  return (
    !isExposed ||
    target.top < SAFE_TARGET_MARGIN ||
    target.left < SAFE_TARGET_MARGIN ||
    target.top + target.height > viewport.height - SAFE_TARGET_MARGIN ||
    target.left + target.width > viewport.width - SAFE_TARGET_MARGIN
  );
}

export function getGuideHighlightRect(
  target: GuideRect,
  viewport: { width: number; height: number },
): GuideRect {
  const left = clamp(target.left - HIGHLIGHT_PADDING, 8, viewport.width - 8);
  const top = clamp(target.top - HIGHLIGHT_PADDING, 8, viewport.height - 8);
  const right = clamp(
    target.left + target.width + HIGHLIGHT_PADDING,
    left,
    viewport.width - 8,
  );
  const bottom = clamp(
    target.top + target.height + HIGHLIGHT_PADDING,
    top,
    viewport.height - 8,
  );
  return { top, left, width: right - left, height: bottom - top };
}

export function getGuidePosition(
  target: GuideRect,
  popover: { width: number; height: number },
  viewport: { width: number; height: number },
): GuidePosition {
  const right =
    viewport.width -
    (target.left + target.width) -
    TARGET_GAP -
    VIEWPORT_GUTTER;
  const left = target.left - TARGET_GAP - VIEWPORT_GUTTER;
  const below =
    viewport.height -
    (target.top + target.height) -
    TARGET_GAP -
    VIEWPORT_GUTTER;
  const above = target.top - TARGET_GAP - VIEWPORT_GUTTER;
  const spaces = { right, left, below, above };
  const placement =
    (["right", "left", "below", "above"] as const).find(
      (side) =>
        spaces[side] >=
        (side === "right" || side === "left" ? popover.width : popover.height),
    ) ??
    (["right", "left", "below", "above"] as const).reduce((best, side) =>
      spaces[side] > spaces[best] ? side : best,
    );

  const centeredTop = target.top + target.height / 2 - popover.height / 2;
  const centeredLeft = target.left + target.width / 2 - popover.width / 2;
  const raw =
    placement === "right"
      ? { top: centeredTop, left: target.left + target.width + TARGET_GAP }
      : placement === "left"
        ? { top: centeredTop, left: target.left - popover.width - TARGET_GAP }
        : placement === "below"
          ? { top: target.top + target.height + TARGET_GAP, left: centeredLeft }
          : {
              top: target.top - popover.height - TARGET_GAP,
              left: centeredLeft,
            };

  return {
    placement,
    top: clamp(
      raw.top,
      VIEWPORT_GUTTER,
      viewport.height - popover.height - VIEWPORT_GUTTER,
    ),
    left: clamp(
      raw.left,
      VIEWPORT_GUTTER,
      viewport.width - popover.width - VIEWPORT_GUTTER,
    ),
  };
}
