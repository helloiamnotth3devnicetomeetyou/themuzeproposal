import { guideSandboxFetch } from "@/core/supabase/guide-sandbox";

export type PublicCacheTag =
  | "artist-scene-data"
  | "public-artist-schedule"
  | "public-artist-title"
  | "public-discography"
  | "public-home-slides"
  | "public-member-title"
  | "public-navigation-artists"
  | "public-notice-title"
  | "public-notices"
  | "public-site-settings";

export async function revalidatePublicCache(...tags: PublicCacheTag[]) {
  try {
    const response = await guideSandboxFetch("/api/admin/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags }),
    });
    if (!response.ok) throw new Error();
    return true;
  } catch {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("admin-toast", {
          detail:
            "Saved, but the public page cache could not be refreshed. Please try again.",
        }),
      );
    }
    return false;
  }
}
