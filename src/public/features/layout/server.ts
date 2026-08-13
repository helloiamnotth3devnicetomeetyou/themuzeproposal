import "server-only";

import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { getPublicSupabaseConfig } from "@/core/config/public-env";
import { getPublicAssetUrl } from "@/core/storage/public-url";
import { createSupabaseServerClient } from "@/core/supabase/server";
import type {
  ArtistNavigationItem,
  NavigationAccount,
} from "@/public/components/layout/navbar-types";
import type { SiteSettingsPreviewPayload } from "@/core/preview/types";
import {
  EMPTY_SETTINGS,
  normalizeSiteSettings,
} from "@/public/features/settings/data";

const { url, anonKey, projectRef } = getPublicSupabaseConfig();

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

export async function getNavigationAccount(): Promise<NavigationAccount> {
  const hasAuthCookie = (await cookies())
    .getAll()
    .some(({ name }) => name.startsWith(`sb-${projectRef}-auth-token`));
  if (!hasAuthCookie)
    return {
      isLoggedIn: false,
      isAdmin: false,
      avatarUrl: null,
      initial: "A",
      name: "관리자",
    };

  const client = await createSupabaseServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user)
    return {
      isLoggedIn: false,
      isAdmin: false,
      avatarUrl: null,
      initial: "A",
      name: "관리자",
    };

  const fallbackName =
    user.user_metadata?.name?.trim() || user.email?.split("@")[0] || "관리자";
  const { data: profile } = await client
    .from("profiles")
    .select("role,name,avatar_asset_id")
    .eq("id", user.id)
    .maybeSingle();
  const name = profile?.name?.trim() || fallbackName;
  const { data: avatar } = profile?.avatar_asset_id
    ? await client
        .from("avatar_assets")
        .select("image_path")
        .eq("id", profile.avatar_asset_id)
        .eq("is_active", true)
        .maybeSingle()
    : { data: null };

  return {
    isLoggedIn: true,
    isAdmin: profile?.role === "super_admin" || profile?.role === "editor",
    avatarUrl: avatar?.image_path
      ? getPublicAssetUrl("artist-assets", avatar.image_path)
      : null,
    initial: (name[0] || "A").toUpperCase(),
    name,
  };
}
