import "server-only";

import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { getPublicSupabaseConfig } from "@/core/config/public-env";
import { fetchArtistSchedule } from "./repository";
import type { PublicScheduleData } from "./types";

const { url, anonKey } = getPublicSupabaseConfig();

const getCachedArtistSchedule = unstable_cache(
  async (artistSlug: string): Promise<PublicScheduleData | null> => {
    const client = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const result = await fetchArtistSchedule(client, artistSlug);
    if (result.failure === "not-found") return null;
    // Throw so a transient failure is never cached as "this artist has no schedule".
    if (result.failure) throw new Error(result.failure);
    return result.data;
  },
  ["public-artist-schedule"],
  { revalidate: 300, tags: ["public-artist-schedule"] },
);

export async function loadPublicArtistSchedule(
  artistSlug: string,
): Promise<{ data: PublicScheduleData | null; loadFailed: boolean }> {
  try {
    return {
      data: await getCachedArtistSchedule(artistSlug),
      loadFailed: false,
    };
  } catch {
    return { data: null, loadFailed: true };
  }
}
