import { describe, expect, it } from "vitest";
import { PREVIEW_VERSION, parsePreviewEnvelope } from "./types";

describe("parsePreviewEnvelope", () => {
  it("accepts an artist preview without a Japanese name", () => {
    const token = "11111111-1111-4111-8111-111111111111";
    const envelope = {
      version: PREVIEW_VERSION,
      token,
      kind: "artist-profile",
      targetPath: "/rescene/artist",
      revision: 1,
      updatedAt: Date.now(),
      expiresAt: Date.now() + 60_000,
      payload: {
        artist: {
          id: "artist-1",
          slug: "rescene",
          name: "RESCENE",
          eng_name: "RESCENE",
          name_ko: "리센느",
          name_en: "RESCENE",
          name_ja: null,
          type: "group",
          debut_date: null,
          image_url: null,
          logo_url: null,
          color: null,
          description_ko: null,
          description_en: null,
          description_ja: null,
          social_links: [],
          is_active: true,
        },
      },
    };

    expect(parsePreviewEnvelope(JSON.stringify(envelope), token)).toEqual(
      envelope,
    );
  });
});
