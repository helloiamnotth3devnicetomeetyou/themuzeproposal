import assert from "node:assert/strict";

const galleryAssetPath = "/storage/v1/object/public/artist-assets/";

export function galleryAssetUrl(imageUrl, storageUrl) {
  const url = new URL(imageUrl);
  assert(url.origin === new URL(storageUrl).origin && url.pathname.startsWith(galleryAssetPath), `untrusted gallery image URL: ${imageUrl}`);
  return url;
}
