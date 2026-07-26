import "server-only";

import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { getPublicSupabaseConfig } from "@/core/config/public-env";
import { localizeText, type Locale } from "@/core/i18n/localized";

const { url, anonKey } = getPublicSupabaseConfig();
const client = createClient(url, anonKey);

type ArtistTitle = { name: string; eng_name: string | null; name_ko: string | null; name_en: string | null; name_ja: string | null };
type MemberTitle = { name: string; eng_name: string | null; name_ko: string | null; name_en: string | null; name_ja: string | null; artist: ArtistTitle | null };
type NoticeTitle = { title_en: string | null; title_ko: string | null; title_ja: string | null };

export const getPublicArtistTitle = unstable_cache(async (slug: string): Promise<ArtistTitle | null> => {
  let result = await client.from("artists").select("name,eng_name,name_ko,name_en,name_ja").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (result.error?.code === "42703") {
    const legacy = await client.from("artists").select("name,eng_name").eq("slug", slug).eq("is_active", true).maybeSingle();
    result = { ...legacy, data: legacy.data ? { ...legacy.data, name_ko: legacy.data.name, name_en: legacy.data.eng_name, name_ja: null } : null } as typeof result;
  }
  return result.data as ArtistTitle | null;
}, ["public-artist-title"], { revalidate: 300, tags: ["public-artist-title"] });

export const getPublicMemberTitle = unstable_cache(async (artistSlug: string, memberSlug: string): Promise<MemberTitle | null> => {
  let result = await client
    .from("artist_members")
    .select("name,eng_name,name_ko,name_en,name_ja,artist:artists!inner(name,eng_name,name_ko,name_en,name_ja,slug,is_active)")
    .eq("slug", memberSlug)
    .eq("artist.slug", artistSlug)
    .eq("artist.is_active", true)
    .maybeSingle();
  if (result.error?.code === "42703") {
    const legacy = await client
      .from("artist_members")
      .select("name,eng_name,artist:artists!inner(name,eng_name,slug,is_active)")
      .eq("slug", memberSlug)
      .eq("artist.slug", artistSlug)
      .eq("artist.is_active", true)
      .maybeSingle();
    const legacyArtist = Array.isArray(legacy.data?.artist) ? legacy.data?.artist[0] : legacy.data?.artist;
    result = {
      ...legacy,
      data: legacy.data ? {
        ...legacy.data,
        name_ko: legacy.data.name,
        name_en: legacy.data.eng_name,
        name_ja: null,
        artist: legacyArtist ? { ...legacyArtist, name_ko: legacyArtist.name, name_en: legacyArtist.eng_name, name_ja: null } : null,
      } : null,
    } as typeof result;
  }
  return result.data as MemberTitle | null;
}, ["public-member-title"], { revalidate: 300, tags: ["public-member-title"] });

export const getPublicNoticeTitle = unstable_cache(async (id: string): Promise<NoticeTitle | null> => {
  let result = await client.from("notices").select("title_en,title_ko,title_ja").eq("id", id).eq("is_published", true).maybeSingle();
  if (result.error?.code === "42703") {
    const legacy = await client.from("notices").select("title_en,title_ko").eq("id", id).eq("is_published", true).maybeSingle();
    result = { ...legacy, data: legacy.data ? { ...legacy.data, title_ja: null } : null } as typeof result;
  }
  return result.data as NoticeTitle | null;
}, ["public-notice-title"], { revalidate: 300, tags: ["public-notice-title"] });

export function displayName(entity: { name?: string | null; eng_name?: string | null; name_ko?: string | null; name_en?: string | null; name_ja?: string | null } | null, locale: Locale) {
  return entity ? localizeText({ ko: entity.name_ko ?? entity.name, en: entity.name_en ?? entity.eng_name, ja: entity.name_ja }, locale, entity.name ?? "") || null : null;
}

export function noticeDisplayTitle(notice: NoticeTitle | null, locale: Locale) {
  return notice ? localizeText({ ko: notice.title_ko, en: notice.title_en, ja: notice.title_ja }, locale) || null : null;
}

export function pageTypeLabel(type: "artist" | "discography" | "schedule" | "notices" | "notice", locale: Locale) {
  const labels = {
    ko: { artist: "아티스트", discography: "디스코그래피", schedule: "일정", notices: "공지", notice: "공지" },
    en: { artist: "Artist", discography: "Discography", schedule: "Schedule", notices: "Notices", notice: "Notice" },
    ja: { artist: "アーティスト", discography: "ディスコグラフィー", schedule: "スケジュール", notices: "お知らせ", notice: "お知らせ" },
  } satisfies Record<Locale, Record<typeof type, string>>;
  return labels[locale][type];
}
