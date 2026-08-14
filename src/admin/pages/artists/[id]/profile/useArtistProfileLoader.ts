"use client";

import { useEffect } from "react";
import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";
import { supabase } from "@/core/supabase/client";
import { normalizeSocialLinks } from "@/admin/components/content/SocialLinksField";
import type { ProfileDraft } from "./profile-editor-model";

export function useArtistProfileLoader(
  routeId: string | undefined,
  isNew: boolean,
  setArtistId: (id: string) => void,
  setDraft: (draft: ProfileDraft) => void,
  setSnapshot: (snapshot: string) => void,
  setLoading: (loading: boolean) => void,
  setError: (message: string) => void,
) {
  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("artists")
        .select("*")
        .eq("id", routeId)
        .single();
      if (cancelled) return;
      if (error || !data) {
        setError("아티스트 정보를 불러오지 못했습니다.");
        setLoading(false);
        return;
      }
      const draft: ProfileDraft = {
        name: data.name_ko || data.name || "",
        engName: data.name_en || data.eng_name || "",
        jaName: data.name_ja || "",
        type: data.type || "group",
        debutDate: data.debut_date || "",
        imageUrl: data.image_url || "",
        logoUrl: data.logo_url || "",
        color: data.color || BRAND_PINK_HEX,
        descKo: data.description_ko || "",
        descEn: data.description_en || "",
        descJa: data.description_ja || "",
        socialLinks: normalizeSocialLinks(data.social_links),
        isActive: data.is_active ?? true,
        updatedAt: data.updated_at,
      };
      setArtistId(data.id);
      setDraft(draft);
      setSnapshot(JSON.stringify(draft));
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [
    isNew,
    routeId,
    setArtistId,
    setDraft,
    setError,
    setLoading,
    setSnapshot,
  ]);
}
