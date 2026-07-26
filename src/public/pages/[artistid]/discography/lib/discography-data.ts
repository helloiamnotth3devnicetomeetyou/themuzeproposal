import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";
import { supabase } from "@/core/supabase/client";

import type { DiscographyAlbum, RawDiscographyAlbum } from "./types";

const ALBUM_SELECT =
  "id,title,title_ko,title_en,title_ja,type,release_date,cover_url,hero_image_url,typo_logo_url,color,description_ko,description_en,description_ja,spotify_id,youtube_url,tracks(title,title_ko,title_en,title_ja,track_number,is_title,spotify_url,youtube_url,audio_url,music_video_url)";

export async function fetchDiscography(artistSlug: string) {
  let artistResult = await supabase
    .from("artists")
    .select("id,name,eng_name,name_ko,name_en,name_ja")
    .eq("slug", artistSlug)
    .maybeSingle();

  if (artistResult.error?.code === "42703") {
    const legacy = await supabase.from("artists").select("id,name,eng_name").eq("slug", artistSlug).maybeSingle();
    artistResult = { ...legacy, data: legacy.data ? { ...legacy.data, name_ko: legacy.data.name, name_en: legacy.data.eng_name, name_ja: null } : null } as typeof artistResult;
  }
  if (artistResult.error) {
    throw new Error("아티스트 정보를 불러오지 못했습니다.");
  }

  const artist = artistResult.data;
  if (!artist) {
    throw new Error("존재하지 않는 아티스트입니다.");
  }

  let albumsResult = await supabase
    .from("albums")
    .select(ALBUM_SELECT)
    .eq("artist_id", artist.id)
    .eq("is_published", true)
    .lte("published_at", new Date().toISOString())
    .order("sort_order", { ascending: true })
    .overrideTypes<RawDiscographyAlbum[], { merge: false }>();

  if (albumsResult.error?.code === "42703") {
    const legacy = await supabase
      .from("albums")
      .select("id,title,type,release_date,cover_url,hero_image_url,typo_logo_url,color,description_ko,description_en,description_ja,spotify_id,youtube_url,tracks(title,track_number,is_title,spotify_url,youtube_url,audio_url,music_video_url)")
      .eq("artist_id", artist.id)
      .eq("is_published", true)
      .lte("published_at", new Date().toISOString())
      .order("sort_order", { ascending: true });
    albumsResult = {
      ...legacy,
      data: legacy.data?.map((album) => ({
        ...album,
        title_ko: album.title,
        title_en: null,
        title_ja: null,
        tracks: album.tracks.map((track) => ({ ...track, title_ko: track.title, title_en: null, title_ja: null })),
      })) ?? null,
    } as typeof albumsResult;
  }
  if (albumsResult.error) {
    throw new Error("디스코그래피를 불러오지 못했습니다.");
  }

  const albums: DiscographyAlbum[] = (albumsResult.data ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    titles: { ko: item.title_ko ?? item.title, en: item.title_en, ja: item.title_ja },
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
        titles: { ko: track.title_ko ?? track.title, en: track.title_en, ja: track.title_ja },
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
    artistNames: { ko: artist.name_ko ?? artist.name, en: artist.name_en ?? artist.eng_name, ja: artist.name_ja },
    artistName: artist.name || artistSlug.toUpperCase(),
    albums,
  };
}
