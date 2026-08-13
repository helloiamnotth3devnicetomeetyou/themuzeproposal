import type { HeroSlide } from "./HeroSlideCard";

export const getActiveHeroSlides = (slides: HeroSlide[]) =>
  slides.filter((slide) => slide.is_active);

export const createHeroSlideDraft = (
  slides: HeroSlide[],
  storedSlides: HeroSlide[],
  albumId: string,
): HeroSlide => {
  const stored = storedSlides.find((slide) => slide.album_id === albumId);
  return {
    id: stored?.id ?? crypto.randomUUID(),
    album_id: albumId,
    sort_order: Math.max(0, ...slides.map((slide) => slide.sort_order)) + 1,
    is_active: true,
    video_url: stored?.video_url ?? null,
  };
};
