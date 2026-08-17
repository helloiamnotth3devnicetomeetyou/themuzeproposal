import "server-only";

import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { getPublicSupabaseConfig } from "@/core/config/public-env";
import { fetchDiscography } from "./repository";
import type { DiscographyData } from "./types";

const { url, anonKey } = getPublicSupabaseConfig();
const client = createClient(url, anonKey);

const getCachedDiscography = unstable_cache(
  (artistSlug: string): Promise<DiscographyData> =>
    fetchDiscography(client, artistSlug),
  ["public-discography"],
  { revalidate: 300, tags: ["public-discography"] },
);

export async function loadDiscography(artistSlug: string) {
  try {
    return { data: await getCachedDiscography(artistSlug), error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "디스코그래피를 불러오지 못했습니다.",
    };
  }
}
