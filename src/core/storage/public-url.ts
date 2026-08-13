const PUBLIC_BUCKETS = [
  "artist-assets",
  "album-covers",
  "track-assets",
  "business-assets",
  "hero-videos",
] as const;

export type PublicAssetBucket = (typeof PUBLIC_BUCKETS)[number];

function getR2PublicBaseUrl() {
  const url = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim();
  if (!url) throw new Error("Missing required environment variable: NEXT_PUBLIC_R2_PUBLIC_URL");
  return url.replace(/\/+$/, "");
}

/** Builds the public CDN URL for an object stored under `bucket/path` in the R2 public bucket. */
export function getPublicAssetUrl(bucket: string, path: string) {
  return `${getR2PublicBaseUrl()}/${bucket}/${path.replace(/^\/+/, "")}`;
}

/** Origin of the public R2 CDN, for `<link rel="preconnect">` so the TLS handshake with
 * the CDN happens before the first asset request is issued. */
export function getPublicAssetOrigin() {
  return new URL(getR2PublicBaseUrl()).origin;
}

/**
 * Recovers the (bucket, path) pair from a previously issued public asset URL, e.g. one
 * stored on a DB row. Returns null for URLs that aren't managed R2 public assets.
 */
export function managedAssetFromUrl(url: string): { bucket: PublicAssetBucket; path: string } | null {
  let base: URL;
  let target: URL;
  try {
    base = new URL(getR2PublicBaseUrl());
    target = new URL(url);
  } catch {
    return null;
  }
  if (target.origin !== base.origin) return null;
  const prefix = `${base.pathname.replace(/\/+$/, "")}/`;
  if (!target.pathname.startsWith(prefix)) return null;
  const rest = decodeURIComponent(target.pathname.slice(prefix.length));
  const slash = rest.indexOf("/");
  if (slash <= 0) return null;
  const bucket = rest.slice(0, slash);
  const path = rest.slice(slash + 1);
  if (!path || !(PUBLIC_BUCKETS as readonly string[]).includes(bucket)) return null;
  return { bucket: bucket as PublicAssetBucket, path };
}
