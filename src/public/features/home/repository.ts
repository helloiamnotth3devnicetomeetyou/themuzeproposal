import type { SupabaseClient } from "@supabase/supabase-js";
import type { HomeSlideDTO } from "./types";

const HOME_SLIDE_LIMIT = 7 ;

type AlbumRow = {
  id: string;
  artist_id: string;
  title: string;
  title_ko: string | null;
  title_en: string | null;
  title_ja: string | null;
  type: string;
  color: string | null;
  cover_url: string | null;
  hero_image_url: string | null;
  typo_logo_url: string | null;
  spotify_id: string | null;
  youtube_url: string | null;
  description_ko: string | null;
  description_en: string | null;
  description_ja: string | null;
};

type ArtistRow = {
  id: string;
  name: string;
  eng_name: string | null;
  name_ko: string | null;
  name_en: string | null;
  name_ja: string | null;
  slug: string;
};

type HeroSlideRow = {
  id: string;
  album_id: string;
  sort_order: number;
};

export async function getPublicHomeSlides(client: SupabaseClient): Promise<HomeSlideDTO[]> {
  const { data: heroSlideData, error: heroSlideError } = await client
    .from("home_hero_slides")
    .select("id, album_id, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(HOME_SLIDE_LIMIT);

  if (heroSlideError) throw heroSlideError;

  const configuredSlides = (heroSlideData ?? []) as HeroSlideRow[];
  const albumIds = configuredSlides.map((slide) => slide.album_id);
  if (!albumIds.length) return [];

  const albumResult = await client
    .from("albums")
    .select("id, artist_id, title, title_ko, title_en, title_ja, type, color, cover_url, hero_image_url, typo_logo_url, spotify_id, youtube_url, description_ko, description_en, description_ja")
    .in("id", albumIds)
    .eq("is_published", true)
    .lte("published_at", new Date().toISOString());

  if (albumResult.error) throw albumResult.error;

  const albums = (albumResult.data ?? []) as AlbumRow[];
  const albumsById = new Map(albums.map((album) => [album.id, album]));
  const artistIds = [...new Set(albums.map((album) => album.artist_id))];
  if (!artistIds.length) return [];

  const artistResult = await client
    .from("artists")
    .select("id, name, eng_name, name_ko, name_en, name_ja, slug")
    .in("id", artistIds)
    .eq("is_active", true);

  if (artistResult.error) throw artistResult.error;

  const artistsById = new Map(((artistResult.data ?? []) as ArtistRow[]).map((artist) => [artist.id, artist]));
  return configuredSlides.flatMap((heroSlide) => {
    const album = albumsById.get(heroSlide.album_id);
    const artist = album ? artistsById.get(album.artist_id) : null;
    if (!album || !artist) return [];

    return [{
      id: album.id,
      artistName: artist.name,
      artistNames: { ko: artist.name_ko ?? artist.name, en: artist.name_en ?? artist.eng_name, ja: artist.name_ja },
      artistSlug: artist.slug,
      title: album.title,
      titles: { ko: album.title_ko ?? album.title, en: album.title_en, ja: album.title_ja },
      type: album.type,
      color: album.color,
      imageUrl: album.hero_image_url || album.cover_url || "",
      typoLogoUrl: album.typo_logo_url,
      spotifyId: album.spotify_id,
      youtubeUrl: album.youtube_url,
      descriptions: {
        ko: album.description_ko ?? "",
        en: album.description_en ?? album.description_ko ?? "",
        ja: album.description_ja ?? album.description_en ?? album.description_ko ?? "",
      },
    }];
  });
}
