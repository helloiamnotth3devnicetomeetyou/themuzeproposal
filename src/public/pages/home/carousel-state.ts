export type CarouselTransition = { current: number; previous: number | null };

export function startSlideTransition(current: number, next: number, length: number): CarouselTransition {
  const normalized = ((next % length) + length) % length;
  return { current: normalized, previous: normalized === current ? null : current };
}

export const autoplayProgress = (elapsed: number, duration: number) => Math.min(1, elapsed / duration);

export const swipeSlideOffset = (startX: number, endX: number, threshold = 48) =>
  Math.abs(endX - startX) < threshold ? 0 : endX < startX ? 1 : -1;
