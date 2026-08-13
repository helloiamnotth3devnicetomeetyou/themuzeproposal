"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/core/supabase/client";
import { adminDbError } from "@/admin/utils/admin-db-error";
import {
  normalizeScene,
  sceneSelect,
  type MemberLookup,
} from "./artist-scene-editor-model";
import type { ArtistScene } from "@/core/utils/artist-scenes";

export function useArtistSceneLoader(
  artistId: string | null,
  onError: (message: string) => void,
  setScenes: (
    value: ArtistScene[] | ((current: ArtistScene[]) => ArtistScene[]),
  ) => void,
  setSnapshot: (value: ArtistScene[]) => void,
  setMembers: (value: MemberLookup[]) => void,
  setArtistUpdatedAt: (value: string | null) => void,
  setSelectedSceneId: (
    value: string | null | ((current: string | null) => string | null),
  ) => void,
) {
  const [loading, setLoading] = useState(Boolean(artistId));
  const [schemaMissing, setSchemaMissing] = useState(false);
  const load = useCallback(
    async (preferredSceneId?: string) => {
      if (!artistId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const [sceneResult, memberResult, artistResult] = await Promise.all([
        supabase
          .from("artist_scenes")
          .select(sceneSelect)
          .eq("artist_id", artistId)
          .order("is_hero", { ascending: false })
          .order("sort_order", { ascending: true })
          .overrideTypes<ArtistScene[], { merge: false }>(),
        supabase
          .from("artist_members")
          .select("id,name,eng_name,color,sort_order")
          .eq("artist_id", artistId)
          .order("sort_order", { ascending: true }),
        supabase.from("artists").select("updated_at").eq("id", artistId).single(),
      ]);
      setLoading(false);
      if (sceneResult.error) {
        const missing = sceneResult.error.message.includes("artist_scenes");
        setSchemaMissing(missing);
        onError(
          missing
            ? "인터랙티브 장면 테이블이 없습니다. 019_artist_scenes.sql을 먼저 적용하세요."
            : adminDbError(sceneResult.error, "장면을 불러오지 못했습니다."),
        );
        return;
      }
      setSchemaMissing(false);
      const nextScenes = (sceneResult.data ?? []).map(normalizeScene);
      setScenes(nextScenes);
      setSnapshot(nextScenes);
      setMembers((memberResult.data as MemberLookup[] | null) ?? []);
      setArtistUpdatedAt(artistResult.data?.updated_at ?? null);
      setSelectedSceneId((current) => {
        const candidate = preferredSceneId || current;
        return candidate && nextScenes.some((scene) => scene.id === candidate)
          ? candidate
          : (nextScenes[0]?.id ?? null);
      });
    },
    [artistId, onError, setArtistUpdatedAt, setMembers, setScenes, setSelectedSceneId, setSnapshot],
  );

  useEffect(() => {
    void Promise.resolve().then(() => load());
  }, [load]);
  return { load, loading, schemaMissing };
}
