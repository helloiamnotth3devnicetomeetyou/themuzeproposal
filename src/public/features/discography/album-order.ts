import type { DiscographyAlbum } from "./types";

export function newestAlbumsFirst(albums: DiscographyAlbum[]) {
  return [...albums].sort((a, b) =>
    (b.releaseDate || "").localeCompare(a.releaseDate || ""),
  );
}
