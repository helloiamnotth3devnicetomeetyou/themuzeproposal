"use client";

import { useEffect, useMemo, useState } from "react";
import { usePreviewPayload } from "@/core/preview/PreviewProvider";
import type { SiteSettingsPreviewPayload } from "@/core/preview/types";
import { DEFAULT_HISTORY, normalizeHistory } from "@/core/content/site-content";
import { supabase } from "@/core/supabase/client";
import { detectSocialPlatform } from "@/core/content/social-icons";

const EMPTY_SETTINGS: SiteSettingsPreviewPayload = {
  company: {
    name_ko: "",
    name_en: "",
    name_ja: "",
    address_ko: "",
    address_en: "",
    address_ja: "",
    email: "",
  },
  history: DEFAULT_HISTORY,
  footer: { copyright: "" },
  social: [],
};

const normalizeSocial = (value: unknown): SiteSettingsPreviewPayload["social"] => {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => {
      if (!item || typeof item !== "object") return [];
      const candidate = item as Record<string, unknown>;
      const url = typeof candidate.url === "string" ? candidate.url.trim() : "";
      if (!url) return [];
      return [{
        id: typeof candidate.id === "string" ? candidate.id : `site-social-${index}`,
        platform: detectSocialPlatform(url) !== "other" ? detectSocialPlatform(url) : (typeof candidate.platform === "string" ? candidate.platform : "other"),
        label: typeof candidate.label === "string" ? candidate.label : "",
        url,
      }];
    });
  }
  if (!value || typeof value !== "object") return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([platform, url], index) =>
    typeof url === "string" && url.trim()
      ? [{ id: `site-social-${index}`, platform, label: "", url: url.trim() }]
      : [],
  );
};

export function useSiteSettings() {
  const preview = usePreviewPayload("site-settings");
  const [stored, setStored] = useState<SiteSettingsPreviewPayload>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(!preview);

  useEffect(() => {
    if (preview) return;

    let active = true;
    async function load() {
      setLoading(true);
      const { data } = await supabase.from("site_settings").select("key,value");
      if (!active) return;
      const next: SiteSettingsPreviewPayload = structuredClone(EMPTY_SETTINGS);
      data?.forEach((item) => {
        if (item.key === "company" && item.value && typeof item.value === "object") {
          next.company = { ...next.company, ...(item.value as Partial<typeof next.company>) };
        }
        if (item.key === "history") next.history = normalizeHistory(item.value);
        if (item.key === "footer" && item.value && typeof item.value === "object") {
          next.footer = { ...next.footer, ...(item.value as Partial<typeof next.footer>) };
        }
        if (item.key === "social") next.social = normalizeSocial(item.value);
      });
      setStored(next);
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [preview]);

  return useMemo(
    () => ({ settings: preview ?? stored, loading: preview ? false : loading }),
    [loading, preview, stored],
  );
}
