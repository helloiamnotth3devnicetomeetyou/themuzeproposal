import "server-only";

import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { getPublicSupabaseConfig } from "@/core/config/public-env";
import type { ArtistNavigationItem } from "@/public/components/layout/navbar-types";
import type { SiteSettingsPreviewPayload } from "@/core/preview/types";
import { EMPTY_SETTINGS, normalizeSiteSettings } from "@/public/features/settings/data";

const { url, anonKey } = getPublicSupabaseConfig();

function createPublicClient() {
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const getCachedNavigationArtists = unstable_cache(
  async (): Promise<ArtistNavigationItem[]> => {
    const client = createPublicClient();
    const result = await client
      .from("artists")
      .select("id, slug, name, eng_name, name_ko, name_en, name_ja, logo_url")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (result.error) return [];
    return (result.data ?? []) as ArtistNavigationItem[];
  },
  ["public-navigation-artists"],
  { revalidate: 300, tags: ["public-navigation-artists"] },
);

export const getCachedSiteSettings = unstable_cache(
  async (): Promise<SiteSettingsPreviewPayload> => {
    const { data, error } = await createPublicClient()
      .from("site_settings")
      .select("key,value");

    if (error) return EMPTY_SETTINGS;
    return normalizeSiteSettings(data);
  },
  ["public-site-settings"],
  { revalidate: 300, tags: ["public-site-settings"] },
);
