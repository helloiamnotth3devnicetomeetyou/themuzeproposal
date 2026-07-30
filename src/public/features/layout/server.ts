import "server-only";

import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
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

export const getCachedNavigationArtists = cache(
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
);

export const getCachedSiteSettings = cache(
  async (): Promise<SiteSettingsPreviewPayload> => {
    const { data, error } = await createPublicClient()
      .from("site_settings")
      .select("key,value");

    if (error) return EMPTY_SETTINGS;
    return normalizeSiteSettings(data);
  },
);
