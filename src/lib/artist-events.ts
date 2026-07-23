export const ARTISTS_CHANGED_EVENT = "themuze:artists-changed";

export function notifyArtistsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ARTISTS_CHANGED_EVENT));
  }
}
