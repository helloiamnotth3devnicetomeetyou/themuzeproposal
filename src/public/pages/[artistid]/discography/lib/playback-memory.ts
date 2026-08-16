import type { PlaybackMemory } from "./types";

function storageKey(artistSlug: string) {
  return `themuze:discography:${artistSlug}`;
}

function isPlaybackMemory(value: unknown): value is PlaybackMemory {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const memory = value as Record<string, unknown>;
  return (
    typeof memory.albumId === "string" &&
    memory.albumId.length > 0 &&
    typeof memory.trackIndex === "number" &&
    Number.isInteger(memory.trackIndex) &&
    memory.trackIndex >= 0 &&
    typeof memory.currentTime === "number" &&
    Number.isFinite(memory.currentTime) &&
    memory.currentTime >= 0
  );
}

export function readPlaybackMemory(artistSlug: string): PlaybackMemory | null {
  try {
    const key = storageKey(artistSlug);
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(stored);
    } catch {
      localStorage.removeItem(key);
      return null;
    }
    if (!isPlaybackMemory(parsed)) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed;
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
