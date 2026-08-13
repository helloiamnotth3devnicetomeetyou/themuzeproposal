import assert from "node:assert/strict";

export function galleryAssetUrl(imageUrl, r2PublicUrl) {
  const url = new URL(imageUrl);
  const base = new URL(r2PublicUrl);
  const galleryAssetPath = `${base.pathname.replace(/\/+$/, "")}/artist-assets/`;
  assert(
    url.origin === base.origin && url.pathname.startsWith(galleryAssetPath),
    `untrusted gallery image URL: ${imageUrl}`,
  );
  return url;
}
