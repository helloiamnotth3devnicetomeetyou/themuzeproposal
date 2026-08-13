"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/core/supabase/client";
import { normalizeOutline, type ArtistScene } from "@/core/utils/artist-scenes";
import type { Artist, ArtistSceneData, Member } from "./artist-scene-types";

const memberSelect =
  "id,slug,name,eng_name,name_ko,name_en,name_ja,role_ko,role_en,role_ja,image_url,color,bio_ko,bio_en,bio_ja,sort_order";
const sceneSelect =
  "id,artist_id,title,title_ko,title_en,title_ja,link_url,image_url,image_width,image_height,is_hero,is_published,sort_order,artist_scene_members(member_id)";
const regionSelect = "id,member_id,outline,mask_url,sort_order";

function normalizeScene(value: ArtistScene): ArtistScene {
  return {
    ...value,
    artist_scene_members: (value.artist_scene_members ?? [])
      .map((region) => ({
        ...region,
        outline: normalizeOutline(region.outline),
      }))
      .filter((region) => region.outline.length >= 3)
      .sort((a, b) => a.sort_order - b.sort_order),
  };
}

async function getSceneMembers(sceneId: string) {
  const result = await supabase
    .from("artist_scene_members")
    .select(regionSelect)
    .eq("scene_id", sceneId)
    .order("sort_order");
  if (result.error) throw result.error;
  return (result.data ?? [])
    .map((region) => ({ ...region, outline: normalizeOutline(region.outline) }))
    .filter((region) => region.outline.length >= 3);
}

export function useArtistSceneData({
  artistSlug,
  profilePreview,
  memberPreview,
  initialData = null,
}: {
  artistSlug: string;
  profilePreview: unknown;
  memberPreview: unknown;
  initialData?: ArtistSceneData | null;
}) {
  const previews = useRef({ profilePreview, memberPreview });
  const [data, setData] = useState<ArtistSceneData | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");
  const loadedSceneIds = useRef(
    new Set(
      initialData?.scenes
        .filter((scene) => !scene.member_ids?.length)
        .map((scene) => scene.id),
    ),
  );
  useEffect(() => {
    previews.current = { profilePreview, memberPreview };
  }, [profilePreview, memberPreview]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const current = previews.current;
    const previewArtist = (current.profilePreview as { artist?: Artist } | null)
      ?.artist;
    const previewMember = (
      current.memberPreview as { member?: Member & { artist: Artist } } | null
    )?.member;
    let query = supabase
      .from("artists")
      .select(
        `id,slug,name,eng_name,name_ko,name_en,name_ja,image_url,logo_url,color,description_ko,description_en,description_ja,artist_members(${memberSelect}),artist_scenes(${sceneSelect})`,
      );
    query = previewArtist
      ? query.eq("id", previewArtist.id)
      : previewMember
        ? query.eq("id", previewMember.artist.id)
        : query.eq("slug", artistSlug).eq("is_active", true);
    let result = await query.maybeSingle();
    let fetched = result.data as
      | (Artist & { artist_members: Member[]; artist_scenes: ArtistScene[] })
      | null;
    if (!fetched && (previewArtist || previewMember)) {
      result = await supabase
        .from("artists")
        .select(
          `id,slug,name,eng_name,name_ko,name_en,name_ja,image_url,logo_url,color,description_ko,description_en,description_ja,artist_members(${memberSelect}),artist_scenes(${sceneSelect})`,
        )
        .eq("slug", artistSlug)
        .eq("is_active", true)
        .maybeSingle();
      fetched = result.data as
        | (Artist & { artist_members: Member[]; artist_scenes: ArtistScene[] })
        | null;
    }
    const artist = fetched
      ? { ...fetched, ...previewMember?.artist, ...previewArtist }
      : (previewArtist ?? previewMember?.artist);
    if (!artist) {
      setError(result.error?.message || "Artist not found.");
      setLoading(false);
      return;
    }
    let members = [...(fetched?.artist_members ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    if (previewMember)
      members = [
        ...members.filter((member) => member.id !== previewMember.id),
        previewMember,
      ].sort((a, b) => a.sort_order - b.sort_order);
    let scenes = [...(fetched?.artist_scenes ?? [])]
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
    if (!scenes.length && artist.image_url)
      scenes = [
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
          artist_scene_members: [],
        },
      ];
    loadedSceneIds.current = new Set(
      scenes
        .filter((scene) => !scene.member_ids?.length)
        .map((scene) => scene.id),
    );
    setData({ artist, members, scenes });
    setError(
      result.error?.message ||
        (!artist.image_url && !scenes.length
          ? "No hero scene has been published."
          : ""),
    );
    setLoading(false);
  }, [artistSlug]);
  useEffect(() => {
    if (profilePreview || memberPreview || !initialData)
      void Promise.resolve().then(load);
  }, [initialData, load, memberPreview, profilePreview]);
  const loadSceneMembers = useCallback(
    async (sceneId: string) => {
      if (loadedSceneIds.current.has(sceneId)) return;
      const scene = data?.scenes.find((item) => item.id === sceneId);
      if (!scene?.member_ids?.length) {
        loadedSceneIds.current.add(sceneId);
        return;
      }
      const regions = await getSceneMembers(sceneId);
      loadedSceneIds.current.add(sceneId);
      setData(
        (current) =>
          current && {
            ...current,
            scenes: current.scenes.map((scene) =>
              scene.id === sceneId
                ? normalizeScene({ ...scene, artist_scene_members: regions })
                : scene,
            ),
          },
      );
    },
    [data],
  );
  return { data, loading, error, reload: load, loadSceneMembers };
}
