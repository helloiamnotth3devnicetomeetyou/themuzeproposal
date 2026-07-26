import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";
import { supabase } from "@/core/supabase/client";

import type { DiscographyAlbum, RawDiscographyAlbum } from "./types";

const ALBUM_SELECT =
  "id,title,type,release_date,cover_url,hero_image_url,typo_logo_url,color,description_ko,description_en,description_ja,spotify_id,youtube_url,tracks(title,track_number,is_title,spotify_url,youtube_url,audio_url,music_video_url)";

export async function fetchDiscography(artistSlug: string) {
  const { data: artist, error: artistError } = await supabase
    .from("artists")
    .select("id,name")
    .eq("slug", artistSlug)
    .maybeSingle();

  if (artistError) {
    throw new Error("아티스트 정보를 불러오지 못했습니다.");
  }

  if (!artist) {
    throw new Error("존재하지 않는 아티스트입니다.");
  }

  const albumsResult = await supabase
    .from("albums")
    .select(ALBUM_SELECT)
    .eq("artist_id", artist.id)
    .eq("is_published", true)
    .lte("published_at", new Date().toISOString())
    .order("sort_order", { ascending: true })
    .overrideTypes<RawDiscographyAlbum[], { merge: false }>();

  if (albumsResult.error) {
    throw new Error("디스코그래피를 불러오지 못했습니다.");
  }

  const albums: DiscographyAlbum[] = (albumsResult.data ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    type: item.type,
    releaseDate: item.release_date ?? "",
    cover: item.cover_url,
    titleImage: item.hero_image_url || undefined,
    typoLogoUrl: item.typo_logo_url || undefined,
    color: item.color || BRAND_PINK_HEX,
    tracks: [...(item.tracks || [])]
      .sort((a, b) => a.track_number - b.track_number)
      .map((track) => ({
        title: track.title,
        isTitle: track.is_title,
        spotifyUrl: track.spotify_url || undefined,
        youtubeUrl: track.youtube_url || undefined,
        audioUrl: track.audio_url || undefined,
        videoUrl: track.music_video_url || undefined,
      })),
    desc: {
      ko: item.description_ko || "",
      en: item.description_en || "",
      ja: item.description_ja || "",
    },
    links: {
      spotify: item.spotify_id
        ? `https://open.spotify.com/album/${item.spotify_id}`
        : undefined,
      youtube: item.youtube_url || undefined,
    },
  }));

  return {
    artistName: artist.name || artistSlug.toUpperCase(),
    albums,
  };
}
