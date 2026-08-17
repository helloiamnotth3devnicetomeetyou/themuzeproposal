import { revalidatePublicCache } from "@/core/utils/public-cache";

export const ARTISTS_CHANGED_EVENT = "themuze:artists-changed";

export async function notifyArtistsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ARTISTS_CHANGED_EVENT));
    await revalidatePublicCache(
      "public-navigation-artists",
      "public-home-slides",
      "artist-scene-data",
      "public-artist-title",
      "public-member-title",
      "public-discography",
      "public-artist-schedule",
      "public-notices",
      "public-notice-title",
    );
  }
}

export function revalidateArtistSceneData() {
  return revalidatePublicCache("artist-scene-data");
}
