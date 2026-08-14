import { supabase } from "@/core/supabase/client";
import { revalidatePublicCache } from "@/core/utils/public-cache";
import {
  type HeroAlbum as Album,
  type HeroArtist as Artist,
  type HeroSlide,
} from "./HeroSlideCard";
import { getActiveHeroSlides } from "./hero-model";

export type HeroLoadResult = {
  artists: Artist[];
  albums: Album[];
  storedSlides: HeroSlide[];
  slides: HeroSlide[];
  revision: string | null;
};

export async function loadHeroData(): Promise<HeroLoadResult> {
  const [
    { data: artistData, error: artistError },
    { data: albumData, error: albumError },
    { data: slideData, error: slideError },
    { data: revisionData, error: revisionError },
  ] = await Promise.all([
    supabase
      .from("artists")
      .select("id, name, slug, color")
      .order("name", { ascending: true }),
    supabase
      .from("albums")
      .select(
        "id, artist_id, title, type, cover_url, hero_image_url, color, release_date, is_published, published_at",
      )
      .order("sort_order", { ascending: true }),
    supabase
      .from("home_hero_slides")
      .select("id, album_id, sort_order, is_active, video_url")
      .order("sort_order", { ascending: true }),
    supabase.rpc("get_home_hero_slide_revision"),
  ]);

  const error = artistError || albumError || slideError || revisionError;
  if (error) throw error;

  const storedSlides = (slideData ?? []) as HeroSlide[];
  return {
    artists: (artistData ?? []) as Artist[],
    albums: (albumData ?? []) as Album[],
    storedSlides,
    slides: getActiveHeroSlides(storedSlides),
    revision: revisionData as string | null,
  };
}

export async function saveHeroSlides({
  slides,
  orderSnapshot,
  revision,
}: {
  slides: HeroSlide[];
  orderSnapshot: string;
  revision: string | null;
}) {
  const previous = JSON.parse(orderSnapshot) as HeroSlide[];
  const removedIds = previous
    .filter((slide) => !slides.some((item) => item.id === slide.id))
    .map((slide) => slide.id);
  const { data, error } = await supabase.rpc("save_home_hero_slides_checked", {
    p_slides: slides,
    p_removed_ids: removedIds,
    p_expected_updated_at: revision,
  });

  return { data: data as string | null, error, removedIds };
}

export async function saveHeroSlideVideo(
  slideId: string,
  videoUrl: string | null,
  revision: string | null,
) {
  const result = await supabase.rpc("save_home_hero_slide_video_checked", {
    p_slide_id: slideId,
    p_video_url: videoUrl,
    p_expected_updated_at: revision,
  });
  if (!result.error) await revalidatePublicCache("public-home-slides");
  return result;
}
