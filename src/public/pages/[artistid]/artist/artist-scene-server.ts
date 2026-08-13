import "server-only";

import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { getPublicSupabaseConfig } from "@/core/config/public-env";
import type { ArtistScene } from "@/core/utils/artist-scenes";
import type { Artist, ArtistSceneData, Member } from "./artist-scene-types";

const { url, anonKey } = getPublicSupabaseConfig();
const client = createClient(url, anonKey);
const memberSelect =
  "id,slug,name,eng_name,name_ko,name_en,name_ja,role_ko,role_en,role_ja,image_url,color,bio_ko,bio_en,bio_ja,sort_order";
const sceneSelect =
  "id,artist_id,title,title_ko,title_en,title_ja,link_url,image_url,image_width,image_height,is_hero,is_published,sort_order,artist_scene_members(member_id)";

export const getArtistSceneData = unstable_cache(
  async (artistSlug: string): Promise<ArtistSceneData | null> => {
    const { data } = await client
      .from("artists")
      .select(
        `id,slug,name,eng_name,name_ko,name_en,name_ja,image_url,logo_url,color,description_ko,description_en,description_ja,artist_members(${memberSelect}),artist_scenes(${sceneSelect})`,
      )
      .eq("slug", artistSlug)
      .eq("is_active", true)
      .maybeSingle();
    const fetched = data as
      | (Artist & { artist_members: Member[]; artist_scenes: ArtistScene[] })
      | null;
    if (!fetched) return null;
    const members = [...(fetched.artist_members ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    let scenes = [...(fetched.artist_scenes ?? [])]
      .filter((scene) => scene.is_published)
      .map((scene) => ({
        ...scene,
        member_ids:
          scene.artist_scene_members?.map((region) => region.member_id) ?? [],
        artist_scene_members: [],
      }))
      .sort(
        (a, b) =>
          Number(b.is_hero) - Number(a.is_hero) || a.sort_order - b.sort_order,
      );
    if (!scenes.length && fetched.image_url)
      scenes = [
        {
          id: "legacy-hero",
          artist_id: fetched.id,
          title: "Main scene",
          title_ko: "메인 장면",
          title_en: "Main scene",
          title_ja: "メインシーン",
          link_url: null,
          image_url: fetched.image_url,
          image_width: null,
          image_height: null,
          is_hero: true,
          is_published: true,
          sort_order: 0,
          member_ids: [],
          artist_scene_members: [],
        },
      ];
    return { artist: fetched, members, scenes };
  },
  ["artist-scene-data"],
  { revalidate: 300, tags: ["artist-scene-data"] },
);
