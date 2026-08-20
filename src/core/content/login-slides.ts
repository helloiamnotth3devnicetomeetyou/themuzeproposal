export const MAX_LOGIN_SLIDES = 5;

export type LoginSlideSource =
  | "legacy"
  | "album-cover"
  | "scene-hero"
  | "member-gallery";

export type LoginSlide = {
  id: string;
  imageUrl: string;
  title: string;
  source: LoginSlideSource;
};

export const DEFAULT_LOGIN_SLIDES: LoginSlide[] = [
  { id: "legacy-1", imageUrl: "/images/hero_1.webp", title: "PRETTY GIRL", source: "legacy" },
  { id: "legacy-2", imageUrl: "/images/hero_2.webp", title: "RUNAWAY", source: "legacy" },
  { id: "legacy-3", imageUrl: "/images/hero_3.webp", title: "LIP BOMB", source: "legacy" },
  { id: "legacy-4", imageUrl: "/images/hero_4.webp", title: "GLOW UP", source: "legacy" },
  { id: "legacy-5", imageUrl: "/images/hero_5.webp", title: "SCENEDROME", source: "legacy" },
];

const SOURCES = new Set<LoginSlideSource>([
  "legacy",
  "album-cover",
  "scene-hero",
  "member-gallery",
]);

const isImageUrl = (value: unknown): value is string =>
  typeof value === "string" &&
  (value.startsWith("/") || /^https?:\/\//i.test(value));

export function normalizeLoginSlides(value: unknown): LoginSlide[] {
  if (!Array.isArray(value)) return DEFAULT_LOGIN_SLIDES;
  const urls = new Set<string>();
  const slides = value.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Record<string, unknown>;
    if (!isImageUrl(candidate.imageUrl) || urls.has(candidate.imageUrl)) return [];
    const source = SOURCES.has(candidate.source as LoginSlideSource)
      ? (candidate.source as LoginSlideSource)
      : "legacy";
    urls.add(candidate.imageUrl);
    return [{
      id: typeof candidate.id === "string" ? candidate.id : `login-slide-${index}`,
      imageUrl: candidate.imageUrl,
      title: typeof candidate.title === "string" ? candidate.title : "Login slide",
      source,
    }];
  });
  return slides.length ? slides.slice(0, MAX_LOGIN_SLIDES) : DEFAULT_LOGIN_SLIDES;
}
