import { guideSandboxFetch } from "@/core/supabase/guide-sandbox";

export type PublicCacheTag =
  | "artist-scene-data"
  | "public-artist-title"
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
            "저장은 완료됐지만 공개 페이지 갱신에 실패했습니다. 새로고침 후 다시 시도해 주세요.",
        }),
      );
    }
    return false;
  }
}
