import "server-only";

import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { getPublicSupabaseConfig } from "@/core/config/public-env";
import { fetchArtistSceneData } from "./repository";
import type { ArtistSceneData } from "./types";

const { url, anonKey } = getPublicSupabaseConfig();
const client = createClient(url, anonKey);

export const getArtistSceneData = unstable_cache(
  (artistSlug: string): Promise<ArtistSceneData | null> =>
    fetchArtistSceneData(client, artistSlug),
  ["artist-scene-data"],
  { revalidate: 300, tags: ["artist-scene-data"] },
);
