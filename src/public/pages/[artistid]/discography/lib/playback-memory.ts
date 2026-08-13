import type { PlaybackMemory } from "./types";

function storageKey(artistSlug: string) {
  return `themuze:discography:${artistSlug}`;
}

export function readPlaybackMemory(artistSlug: string): PlaybackMemory | null {
  try {
    const stored = localStorage.getItem(storageKey(artistSlug));
    return stored ? (JSON.parse(stored) as PlaybackMemory) : null;
  } catch {
    return null;
  }
}

export function savePlaybackMemory(artistSlug: string, memory: PlaybackMemory) {
  try {
    localStorage.setItem(storageKey(artistSlug), JSON.stringify(memory));
  } catch {
    // Playback memory is optional when storage is unavailable.
  }
}

export function requestedAlbumId() {
  return new URLSearchParams(window.location.search).get("album");
}

export function syncAlbumQuery(albumId: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("album", albumId);
  window.history.replaceState({}, "", url);
}
