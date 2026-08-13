"use client";

import { useEffect, useMemo, useState } from "react";
import { usePreviewPayload } from "@/core/preview/PreviewProvider";
import type { SiteSettingsPreviewPayload } from "@/core/preview/types";
import { EMPTY_SETTINGS, normalizeSiteSettings } from "./data";

export function useSiteSettings(
  initialSettings: SiteSettingsPreviewPayload = EMPTY_SETTINGS,
) {
  const preview = usePreviewPayload("site-settings");
  const [stored, setStored] =
    useState<SiteSettingsPreviewPayload>(initialSettings);
  const [loading, setLoading] = useState(
    !preview && initialSettings === EMPTY_SETTINGS,
  );

  useEffect(() => {
    if (preview || initialSettings !== EMPTY_SETTINGS) return;

    let active = true;
    async function load() {
      setLoading(true);
      const { supabase } = await import("@/core/supabase/client");
      const { data } = await supabase.from("site_settings").select("key,value");
      if (!active) return;
      setStored(normalizeSiteSettings(data));
      setLoading(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, [initialSettings, preview]);

  return useMemo(
    () => ({ settings: preview ?? stored, loading: preview ? false : loading }),
    [loading, preview, stored],
  );
}
