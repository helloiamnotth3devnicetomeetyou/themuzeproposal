import type { SupabaseClient } from "@supabase/supabase-js";
import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";
import type { ScheduleFetchResult, ScheduleRow } from "./types";

const SCHEDULE_COLUMNS =
  "id,event_date,start_time,category,title_ko,title_en,title_ja,description_ko,description_en,description_ja,location,location_ko,location_en,location_ja,link_url";
const LEGACY_SCHEDULE_COLUMNS =
  "id,event_date,start_time,category,title_ko,title_en,title_ja,description_ko,description_en,description_ja,location,link_url";

type JoinedArtist = {
  id: string;
  color: string | null;
  artist_schedules: ScheduleRow[] | null;
};

const missingScheduleTable = (message: string) =>
  message.includes("artist_schedules");

/** Single source of the public schedule query, shared by the cached server loader
 * and the client page. Takes an injected client so it works against either the
 * anon server client or the browser client, and is unit-testable without Supabase. */
export async function fetchArtistSchedule(
  client: SupabaseClient,
  artistSlug: string,
): Promise<ScheduleFetchResult> {
  // Single round trip: fetch the artist with its schedules embedded, instead of
  // resolving the artist id first and querying schedules after.
  const joined = await client
    .from("artists")
    .select(`id,color,artist_schedules(${SCHEDULE_COLUMNS})`)
    .eq("slug", artistSlug)
    .eq("is_active", true)
    .order("event_date", { foreignTable: "artist_schedules", ascending: true })
    .order("start_time", {
      foreignTable: "artist_schedules",
      ascending: true,
      nullsFirst: true,
    })
    .order("sort_order", { foreignTable: "artist_schedules", ascending: true })
    .maybeSingle();

  if (joined.error?.message.includes("location_ko"))
    return fetchLegacyArtistSchedule(client, artistSlug);

  if (joined.error)
    return {
      data: null,
      failure: missingScheduleTable(joined.error.message)
        ? "table-missing"
        : "artist-not-found",
    };
  if (!joined.data) return { data: null, failure: "not-found" };

  const artist = joined.data as unknown as JoinedArtist;
  return {
    data: {
      artistColor: artist.color || BRAND_PINK_HEX,
      events: (artist.artist_schedules ?? []) as ScheduleRow[],
    },
  };
}

/** Fallback for environments that have not run the localized-location migration. */
async function fetchLegacyArtistSchedule(
  client: SupabaseClient,
  artistSlug: string,
): Promise<ScheduleFetchResult> {
  const artistResult = await client
    .from("artists")
    .select("id,color")
    .eq("slug", artistSlug)
    .eq("is_active", true)
    .maybeSingle();
  if (artistResult.error || !artistResult.data)
    return { data: null, failure: "artist-not-found" };

  const legacy = await client
    .from("artist_schedules")
    .select(LEGACY_SCHEDULE_COLUMNS)
    .eq("artist_id", artistResult.data.id)
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true, nullsFirst: true })
    .order("sort_order", { ascending: true });
  if (legacy.error)
    return {
      data: null,
      failure: missingScheduleTable(legacy.error.message)
        ? "table-missing"
        : "failed",
    };

  return {
    data: {
      artistColor: artistResult.data.color || BRAND_PINK_HEX,
      events: (legacy.data ?? []).map((row) => ({
        ...row,
        location_ko: row.location,
        location_en: null,
        location_ja: null,
      })) as ScheduleRow[],
    },
  };
}
