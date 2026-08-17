import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { fetchArtistSchedule } from "./repository";

/** Chainable stub whose terminal `maybeSingle`/await both settle to `result`. */
function query(result: unknown) {
  const builder: Record<string, unknown> = {
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve(result).then(resolve),
  };
  for (const key of ["select", "eq", "order"])
    builder[key] = vi.fn(() => builder);
  return builder;
}

function client(...results: unknown[]) {
  const from = vi.fn(() => query(results.shift()));
  return { client: { from } as unknown as SupabaseClient, from };
}

const row = (id: string) => ({
  id,
  event_date: "2026-08-14",
  location: "Seoul",
});

describe("fetchArtistSchedule", () => {
  it("returns the joined artist colour and events", async () => {
    const { client: c } = client({
      data: { id: "1", color: "#abcdef", artist_schedules: [row("a")] },
      error: null,
    });
    const result = await fetchArtistSchedule(c, "artist");
    expect(result.data).toEqual({
      artistColor: "#abcdef",
      events: [row("a")],
    });
  });

  it("distinguishes a missing artist from a missing table", async () => {
    const notFound = await fetchArtistSchedule(
      client({ data: null, error: null }).client,
      "artist",
    );
    expect(notFound.failure).toBe("not-found");

    const tableMissing = await fetchArtistSchedule(
      client({
        data: null,
        error: { message: 'relation "artist_schedules" does not exist' },
      }).client,
      "artist",
    );
    expect(tableMissing.failure).toBe("table-missing");
  });

  it("falls back to the pre-location_ko schema and backfills location_ko", async () => {
    const { client: c, from } = client(
      { data: null, error: { message: "column artists.location_ko" } },
      { data: { id: "1", color: null }, error: null },
      { data: [row("a")], error: null },
    );
    const result = await fetchArtistSchedule(c, "artist");
    expect(from).toHaveBeenCalledTimes(3);
    expect(result.data?.events[0]).toMatchObject({
      location_ko: "Seoul",
      location_en: null,
      location_ja: null,
    });
    // Null artist colour falls back to the brand default rather than staying null.
    expect(result.data?.artistColor).toBeTruthy();
  });

  it("reports a legacy query failure instead of an empty schedule", async () => {
    const { client: c } = client(
      { data: null, error: { message: "column artists.location_ko" } },
      { data: { id: "1", color: null }, error: null },
      { data: null, error: { message: "connection reset" } },
    );
    expect((await fetchArtistSchedule(c, "artist")).failure).toBe("failed");
  });
});
