const SPOTIFY_ALBUM_PREFIX = "https://open.spotify.com/album/";

export function spotifyAlbumId(value: string | null | undefined) {
  const input = value?.trim();
  if (!input) return null;
  try {
    const url = new URL(input);
    if (url.hostname !== "open.spotify.com") return null;
    const [kind, id] = url.pathname.split("/").filter(Boolean);
    return kind === "album" && id ? id : null;
  } catch {
    return /^[A-Za-z0-9]+$/.test(input) ? input : null;
  }
}

export function spotifyAlbumHref(value: string | null | undefined) {
  const id = spotifyAlbumId(value);
  return id ? `${SPOTIFY_ALBUM_PREFIX}${id}` : undefined;
}
