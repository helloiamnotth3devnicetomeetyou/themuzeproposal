import "server-only";

import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { getPublicSupabaseConfig } from "@/core/config/public-env";

const { url, anonKey } = getPublicSupabaseConfig();
const client = createClient(url, anonKey);

type ArtistTitle = { name: string; eng_name: string | null };
type MemberTitle = { name: string; eng_name: string | null; artist: ArtistTitle | null };
type NoticeTitle = { title_en: string | null; title_ko: string | null };

export const getPublicArtistTitle = unstable_cache(async (slug: string): Promise<ArtistTitle | null> => {
  const { data } = await client.from("artists").select("name,eng_name").eq("slug", slug).eq("is_active", true).maybeSingle();
  return data as ArtistTitle | null;
}, ["public-artist-title"], { revalidate: 300, tags: ["public-artist-title"] });

export const getPublicMemberTitle = unstable_cache(async (artistSlug: string, memberSlug: string): Promise<MemberTitle | null> => {
  const { data } = await client
    .from("artist_members")
    .select("name,eng_name,artist:artists!inner(name,eng_name,slug,is_active)")
    .eq("slug", memberSlug)
    .eq("artist.slug", artistSlug)
    .eq("artist.is_active", true)
    .maybeSingle();
  return data as MemberTitle | null;
}, ["public-member-title"], { revalidate: 300, tags: ["public-member-title"] });

export const getPublicNoticeTitle = unstable_cache(async (id: string): Promise<NoticeTitle | null> => {
  const { data } = await client.from("notices").select("title_en,title_ko").eq("id", id).eq("is_published", true).maybeSingle();
  return data as NoticeTitle | null;
}, ["public-notice-title"], { revalidate: 300, tags: ["public-notice-title"] });

export function displayName(entity: { eng_name?: string | null; name?: string | null } | null) {
  return entity?.eng_name?.trim() || entity?.name?.trim() || null;
}

export function noticeDisplayTitle(notice: NoticeTitle | null) {
  return notice?.title_en?.trim() || notice?.title_ko?.trim() || null;
}
