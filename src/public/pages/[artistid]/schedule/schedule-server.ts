import "server-only";

import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";
import { getPublicSupabaseConfig } from "@/core/config/public-env";
import type { PublicScheduleData, ScheduleRow } from "./schedule-types";

const { url, anonKey } = getPublicSupabaseConfig();
const scheduleColumns =
  "id,event_date,start_time,category,title_ko,title_en,title_ja,description_ko,description_en,description_ja,location,location_ko,location_en,location_ja,link_url";
const legacyScheduleColumns =
  "id,event_date,start_time,category,title_ko,title_en,title_ja,description_ko,description_en,description_ja,location,link_url";

type JoinedArtist = {
  id: string;
  color: string | null;
  artist_schedules: ScheduleRow[] | null;
};

const getCachedArtistSchedule = unstable_cache(
  async (artistSlug: string): Promise<PublicScheduleData | null> => {
    const client = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const joined = await client
      .from("artists")
      .select(`id,color,artist_schedules(${scheduleColumns})`)
      .eq("slug", artistSlug)
      .eq("is_active", true)
      .order("event_date", {
        foreignTable: "artist_schedules",
        ascending: true,
      })
      .order("start_time", {
        foreignTable: "artist_schedules",
        ascending: true,
        nullsFirst: true,
      })
      .order("sort_order", {
        foreignTable: "artist_schedules",
        ascending: true,
      })
      .maybeSingle();

    if (joined.error?.message.includes("location_ko")) {
      const artistResult = await client
        .from("artists")
        .select("id,color")
        .eq("slug", artistSlug)
        .eq("is_active", true)
        .maybeSingle();
      if (artistResult.error || !artistResult.data)
        throw artistResult.error ?? new Error("Artist not found");

      const legacy = await client
        .from("artist_schedules")
        .select(legacyScheduleColumns)
        .eq("artist_id", artistResult.data.id)
        .order("event_date", { ascending: true })
        .order("start_time", { ascending: true, nullsFirst: true })
        .order("sort_order", { ascending: true });
      if (legacy.error) throw legacy.error;
      return {
        artistColor: artistResult.data.color || BRAND_PINK_HEX,
        events: (legacy.data ?? []).map((row) => ({
          ...row,
          location_ko: row.location,
          location_en: null,
          location_ja: null,
        })) as ScheduleRow[],
      };
    }

    if (joined.error) throw joined.error;
    if (!joined.data) return null;
    const artist = joined.data as unknown as JoinedArtist;
    return {
      artistColor: artist.color || BRAND_PINK_HEX,
      events: (artist.artist_schedules ?? []) as ScheduleRow[],
    };
  },
  ["public-artist-schedule"],
  { revalidate: 300, tags: ["public-artist-schedule"] },
);

export async function loadPublicArtistSchedule(
  artistSlug: string,
): Promise<{ data: PublicScheduleData | null; loadFailed: boolean }> {
  try {
    return {
      data: await getCachedArtistSchedule(artistSlug),
      loadFailed: false,
    };
  } catch {
    return { data: null, loadFailed: true };
  }
}
