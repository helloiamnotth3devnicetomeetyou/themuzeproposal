import "server-only";

import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { getPublicSupabaseConfig } from "@/core/config/public-env";
import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";
import { safeHref } from "@/core/http/safe-href";
import { spotifyAlbumHref } from "@/core/http/spotify";
import type {
  DiscographyAlbum,
  DiscographyData,
  DiscographyGalleryItem,
  DiscographyMember,
  RawDiscographyAlbum,
} from "./lib/types";

const { url, anonKey } = getPublicSupabaseConfig();
const client = createClient(url, anonKey);
const ALBUM_SELECT =
  "id,title,title_ko,title_en,title_ja,type,release_date,cover_url,hero_image_url,typo_logo_url,color,description_ko,description_en,description_ja,spotify_id,youtube_url,tracks(id,title,title_ko,title_en,title_ja,track_number,is_title,spotify_url,youtube_url,audio_url,music_video_url)";

const getCachedDiscography = unstable_cache(
  async (artistSlug: string): Promise<DiscographyData> => {
    const artistResult = await client
      .from("artists")
      .select("id,name,eng_name,name_ko,name_en,name_ja")
      .eq("slug", artistSlug)
      .eq("is_active", true)
      .maybeSingle();

    if (artistResult.error)
      throw new Error("아티스트 정보를 불러오지 못했습니다.");

    const artist = artistResult.data;
    if (!artist) throw new Error("존재하지 않는 아티스트입니다.");

    const [albumsResult, membersResult, galleryResult] = await Promise.all([
      client
        .from("albums")
        .select(ALBUM_SELECT)
        .eq("artist_id", artist.id)
        .eq("is_published", true)
        .lte("published_at", new Date().toISOString())
        .order("sort_order", { ascending: true })
        .overrideTypes<RawDiscographyAlbum[], { merge: false }>(),
      client
        .from("artist_members")
        .select(
          "id,slug,name,eng_name,name_ko,name_en,name_ja,role_ko,role_en,role_ja,image_url,color,sort_order",
        )
        .eq("artist_id", artist.id)
        .order("sort_order", { ascending: true }),
      client
        .from("artist_gallery")
        .select("id,album_id,member_id,image_url,caption,sort_order")
        .eq("artist_id", artist.id)
        .eq("is_published", true)
        .order("sort_order", { ascending: true }),
    ]);

    if (albumsResult.error || membersResult.error || galleryResult.error)
      throw new Error("디스코그래피를 불러오지 못했습니다.");

    const albums: DiscographyAlbum[] = (albumsResult.data ?? []).map(
      (item) => ({
        id: item.id,
        title: item.title,
        titles: {
          ko: item.title_ko ?? item.title,
          en: item.title_en,
          ja: item.title_ja,
        },
        type: item.type,
        releaseDate: item.release_date ?? "",
        cover: item.cover_url,
        titleImage: item.hero_image_url || undefined,
        typoLogoUrl: item.typo_logo_url || undefined,
        color: item.color || BRAND_PINK_HEX,
        tracks: [...(item.tracks || [])]
          .sort((a, b) => a.track_number - b.track_number)
          .map((track) => ({
            id: track.id,
            title: track.title,
            titles: {
              ko: track.title_ko ?? track.title,
              en: track.title_en,
              ja: track.title_ja,
            },
            isTitle: track.is_title,
            spotifyUrl: safeHref(track.spotify_url),
            youtubeUrl: safeHref(track.youtube_url),
            audioUrl: safeHref(track.audio_url),
            videoUrl: safeHref(track.music_video_url),
          })),
        desc: {
          ko: item.description_ko || "",
          en: item.description_en || "",
          ja: item.description_ja || "",
        },
        links: {
          spotify: spotifyAlbumHref(item.spotify_id),
          youtube: safeHref(item.youtube_url),
        },
      }),
    );

    const members: DiscographyMember[] = (membersResult.data ?? []).map(
      (member) => ({
        id: member.id,
        slug: member.slug,
        name: member.name,
        names: {
          ko: member.name_ko ?? member.name,
          en: member.name_en ?? member.eng_name,
          ja: member.name_ja,
        },
        role: member.role_ko ?? undefined,
        roles: {
          ko: member.role_ko,
          en: member.role_en,
          ja: member.role_ja,
        },
        imageUrl: member.image_url ?? undefined,
        color: member.color || BRAND_PINK_HEX,
        sortOrder: member.sort_order ?? 0,
      }),
    );

    const gallery: DiscographyGalleryItem[] = (galleryResult.data ?? []).map(
      (item) => ({
        id: item.id,
        albumId: item.album_id ?? undefined,
        memberId: item.member_id ?? undefined,
        imageUrl: item.image_url,
        caption: item.caption ?? "",
        sortOrder: item.sort_order ?? 0,
      }),
    );

    return {
      artistNames: {
        ko: artist.name_ko ?? artist.name,
        en: artist.name_en ?? artist.eng_name,
        ja: artist.name_ja,
      },
      artistName: artist.name || artistSlug.toUpperCase(),
      albums,
      members,
      gallery,
    };
  },
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
