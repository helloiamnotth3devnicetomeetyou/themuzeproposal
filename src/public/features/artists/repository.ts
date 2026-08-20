import type { SupabaseClient } from "@supabase/supabase-js";
import type { ArtistScene } from "@/core/utils/artist-scenes";
import type { Artist, ArtistSceneData, Member } from "./types";

const MEMBER_COLUMNS =
  "id,slug,name,eng_name,name_ko,name_en,name_ja,role_ko,role_en,role_ja,image_url,color,bio_ko,bio_en,bio_ja,sort_order";
const SCENE_COLUMNS =
  "id,artist_id,title,title_ko,title_en,title_ja,link_url,image_url,image_width,image_height,is_hero,is_published,sort_order,artist_scene_members(member_id,sort_order)";

type ArtistWithRelations = Artist & {
  artist_members: Member[];
  artist_scenes: ArtistScene[];
};

/** Artists with no published scene still need one to render, so the legacy single
 * hero image is promoted into a synthetic scene. */
function legacyHeroScene(artist: Artist): ArtistScene[] {
  if (!artist.image_url) return [];
  return [
    {
      id: "legacy-hero",
      artist_id: artist.id,
      title: "Main scene",
      title_ko: "메인 장면",
      title_en: "Main scene",
      title_ja: "メインシーン",
      link_url: null,
      image_url: artist.image_url,
      image_width: null,
      image_height: null,
      is_hero: true,
      is_published: true,
      sort_order: 0,
      member_ids: [],
      member_scene_orders: {},
      artist_scene_members: [],
    },
  ];
}

/** Takes an injected client so it is unit-testable without a live Supabase. */
export async function fetchArtistSceneData(
  client: SupabaseClient,
  artistSlug: string,
): Promise<ArtistSceneData | null> {
  const { data, error } = await client
    .from("artists")
    .select(
      `id,slug,name,eng_name,name_ko,name_en,name_ja,image_url,logo_url,color,description_ko,description_en,description_ja,artist_members(${MEMBER_COLUMNS}),artist_scenes(${SCENE_COLUMNS})`,
    )
    .eq("slug", artistSlug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;

  const fetched = data as ArtistWithRelations | null;
  if (!fetched) return null;

  const members = [...(fetched.artist_members ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const scenes = [...(fetched.artist_scenes ?? [])]
    .filter((scene) => scene.is_published)
    .map((scene) => ({
      ...scene,
      member_ids:
        scene.artist_scene_members?.map((region) => region.member_id) ?? [],
      member_scene_orders: Object.fromEntries(
        (scene.artist_scene_members ?? []).map((region) => [
          region.member_id,
          region.sort_order,
        ]),
      ),
      artist_scene_members: [],
    }))
    .sort(
      (a, b) =>
        Number(b.is_hero) - Number(a.is_hero) || a.sort_order - b.sort_order,
    );

  return {
    artist: fetched,
    members,
    scenes: scenes.length ? scenes : legacyHeroScene(fetched),
  };
}
