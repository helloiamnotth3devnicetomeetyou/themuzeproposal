import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260726160000_add_localized_content_fields.sql",
  ),
  "utf8",
).toLowerCase();

describe("localized content migration", () => {
  it("is additive and safe to run again", () => {
    expect(migration.match(/add column if not exists/g)).toHaveLength(18);
    expect(migration).not.toMatch(/\bdrop\s+(column|table)\b/);
  });

  it("backfills legacy canonical values without removing compatibility columns", () => {
    for (const statement of [
      "name_ko = coalesce",
      "name_en = coalesce",
      "set title_ko = title",
      "set location_ko = location",
    ])
      expect(migration).toContain(statement);

    for (const legacyColumn of [
      "artists.name",
      "artists.eng_name",
      "albums.title",
      "tracks.title",
      "artist_schedules.location",
    ]) {
      expect(migration).toContain(legacyColumn);
    }
  });
});
