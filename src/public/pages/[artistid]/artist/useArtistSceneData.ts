"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/core/supabase/client";
import { normalizeOutline, type ArtistScene } from "@/core/utils/artist-scenes";
import type { Artist, ArtistSceneData, Member } from "./artist-scene-types";

const memberSelect = "id,slug,name,eng_name,role_ko,role_en,role_ja,birth,mbti,image_url,color,bio_ko,bio_en,bio_ja,sort_order";
const sceneSelect = "id,artist_id,title,image_url,image_width,image_height,is_hero,is_published,sort_order,artist_scene_members(id,member_id,outline,mask_url,sort_order)";

function normalizeScene(value: ArtistScene): ArtistScene {
  return { ...value, artist_scene_members: (value.artist_scene_members ?? []).map((region) => ({ ...region, outline: normalizeOutline(region.outline) })).filter((region) => region.outline.length >= 3).sort((a, b) => a.sort_order - b.sort_order) };
}

export function useArtistSceneData({ artistSlug, profilePreview, memberPreview }: { artistSlug: string; profilePreview: unknown; memberPreview: unknown }) {
  const previews = useRef({ profilePreview, memberPreview });
  const [data, setData] = useState<ArtistSceneData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { previews.current = { profilePreview, memberPreview }; }, [profilePreview, memberPreview]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const current = previews.current;
    const previewArtist = (current.profilePreview as { artist?: Artist } | null)?.artist;
    const previewMember = (current.memberPreview as { member?: Member & { artist: Artist } } | null)?.member;
    let query = supabase.from("artists").select(`id,slug,name,eng_name,image_url,logo_url,color,description_ko,description_en,description_ja,artist_members(${memberSelect}),artist_scenes(${sceneSelect})`);
    query = previewArtist ? query.eq("id", previewArtist.id) : previewMember ? query.eq("id", previewMember.artist.id) : query.eq("slug", artistSlug).eq("is_active", true);
    const result = await query.maybeSingle();
    const fetched = result.data as (Artist & { artist_members: Member[]; artist_scenes: ArtistScene[] }) | null;
    const artist = previewArtist ?? previewMember?.artist ?? fetched;
    if (!artist) { setError(result.error?.message || "Artist not found."); setLoading(false); return; }
    let members = [...(fetched?.artist_members ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    if (previewMember) members = [...members.filter((member) => member.id !== previewMember.id), previewMember].sort((a, b) => a.sort_order - b.sort_order);
    let scenes = [...(fetched?.artist_scenes ?? [])].filter((scene) => scene.is_published).map(normalizeScene).sort((a, b) => Number(b.is_hero) - Number(a.is_hero) || a.sort_order - b.sort_order);
    if (!scenes.length && artist.image_url) scenes = [{ id: "legacy-hero", artist_id: artist.id, title: "Main scene", image_url: artist.image_url, image_width: null, image_height: null, is_hero: true, is_published: true, sort_order: 0, artist_scene_members: [] }];
    setData({ artist, members, scenes });
    setError(result.error?.message || (!artist.image_url && !scenes.length ? "No hero scene has been published." : ""));
    setLoading(false);
  }, [artistSlug]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  return { data, loading, error, reload: load };
}
