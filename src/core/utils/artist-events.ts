export const ARTISTS_CHANGED_EVENT = "themuze:artists-changed";

export function notifyArtistsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ARTISTS_CHANGED_EVENT));
    void fetch("/api/admin/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag: "public-navigation-artists" }),
    });
  }
}
