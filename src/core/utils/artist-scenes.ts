export type ScenePoint = {
  x: number;
  y: number;
};

type ArtistSceneRegion = {
  id: string;
  member_id: string;
  outline: ScenePoint[];
  mask_url: string | null;
  sort_order: number;
};

export type ArtistScene = {
  id: string;
  artist_id: string;
  title: string;
  title_ko: string | null;
  title_en: string | null;
  title_ja: string | null;
  link_url: string | null;
  image_url: string;
  image_width: number | null;
  image_height: number | null;
  is_hero: boolean;
  is_published: boolean;
  sort_order: number;
  artist_scene_members: ArtistSceneRegion[];
};

export function normalizeSceneLink(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:" ? trimmed : null;
  } catch {
    return null;
  }
}

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function normalizeOutline(value: unknown): ScenePoint[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Partial<ScenePoint>;
    if (typeof candidate.x !== "number" || typeof candidate.y !== "number") return [];
    if (!Number.isFinite(candidate.x) || !Number.isFinite(candidate.y)) return [];
    return [{ x: clamp(candidate.x), y: clamp(candidate.y) }];
  });
}

export function outlineCentroid(points: ScenePoint[]) {
  if (!points.length) return { x: 50, y: 50 };
  const total = points.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), { x: 0, y: 0 });
  return { x: total.x / points.length, y: total.y / points.length };
}

export function outlineToPath(points: ScenePoint[]) {
  if (points.length < 3) return "";
  const point = (index: number) => points[(index + points.length) % points.length];
  const first = points[0];
  let path = `M ${first.x.toFixed(3)} ${first.y.toFixed(3)}`;

  for (let index = 0; index < points.length; index += 1) {
    const previous = point(index - 1);
    const current = point(index);
    const next = point(index + 1);
    const afterNext = point(index + 2);
    const controlOne = {
      x: current.x + (next.x - previous.x) / 6,
      y: current.y + (next.y - previous.y) / 6,
    };
    const controlTwo = {
      x: next.x - (afterNext.x - current.x) / 6,
      y: next.y - (afterNext.y - current.y) / 6,
    };
    path += ` C ${controlOne.x.toFixed(3)} ${controlOne.y.toFixed(3)}, ${controlTwo.x.toFixed(3)} ${controlTwo.y.toFixed(3)}, ${next.x.toFixed(3)} ${next.y.toFixed(3)}`;
  }

  return `${path} Z`;
}

const perpendicularDistance = (point: ScenePoint, start: ScenePoint, end: ScenePoint) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (!dx && !dy) return Math.hypot(point.x - start.x, point.y - start.y);
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
};

function simplifySegment(points: ScenePoint[], tolerance: number): ScenePoint[] {
  if (points.length <= 2) return points;
  let distance = 0;
  let splitIndex = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (let index = 1; index < points.length - 1; index += 1) {
    const nextDistance = perpendicularDistance(points[index], first, last);
    if (nextDistance > distance) {
      distance = nextDistance;
      splitIndex = index;
    }
  }

  if (distance <= tolerance) return [first, last];
  const left = simplifySegment(points.slice(0, splitIndex + 1), tolerance);
  const right = simplifySegment(points.slice(splitIndex), tolerance);
  return [...left.slice(0, -1), ...right];
}

export function simplifyOutline(points: ScenePoint[], tolerance = 0.22) {
  if (points.length < 4) return points;
  const closed = [...points, points[0]];
  const simplified = simplifySegment(closed, tolerance);
  if (simplified.length > 1) simplified.pop();
  return simplified.length >= 3 ? simplified : points;
}
