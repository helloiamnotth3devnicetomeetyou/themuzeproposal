import { describe, expect, it, vi } from "vitest";
import {
  managedAssetFromUrl,
  parseBulkTracks,
  validateAlbum,
  type AlbumEditorDraft,
} from "./music-editor";

const draft = (
  overrides: Partial<AlbumEditorDraft> = {},
): AlbumEditorDraft => ({
  id: "album-1",
  artist_id: "artist-1",
  title: "Album",
  title_ko: "Album",
  title_en: "",
  title_ja: "",
  type: "Mini Album",
  release_date: "2026-01-01",
  cover_url: "https://cdn.example.com/album-covers/artist-1/cover.jpg",
  hero_image_url: "",
  typo_logo_url: "",
  color: "#FFFFFF",
  spotify_id: "",
  youtube_url: "",
  description_ko: "",
  description_en: "",
  description_ja: "",
  is_published: false,
  published_at: null,
  sort_order: 1,
  tracks: [
    {
      id: "track-1",
      title: "Title",
      title_ko: "Title",
      title_en: "",
      title_ja: "",
      is_title: true,
      spotify_url: "",
      youtube_url: "",
      audio_url: "",
      music_video_url: "",
      logo_url: "",
    },
  ],
  ...overrides,
});

describe("music editor utilities", () => {
  it("parses numbered bulk tracks while preserving their titles", () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValueOnce("one").mockReturnValueOnce("two"),
    });
    expect(
      parseBulkTracks("01. First\n2) Second\n\n").map(({ id, title }) => ({
        id,
        title,
      })),
    ).toEqual([
      { id: "one", title: "First" },
      { id: "two", title: "Second" },
    ]);
  });

  it("separates save and publish requirements", () => {
    expect(
      validateAlbum(
        draft({ title: "", release_date: "", cover_url: "", tracks: [] }),
      ),
    ).toMatchObject({
      canSave: false,
      canPublish: false,
      saveIssues: expect.arrayContaining([expect.any(String)]),
      publishIssues: expect.arrayContaining([expect.any(String)]),
    });
    expect(validateAlbum(draft())).toMatchObject({
      canSave: true,
      canPublish: true,
    });
  });

  it("only recognizes managed asset storage URLs", () => {
    vi.stubEnv("NEXT_PUBLIC_R2_PUBLIC_URL", "https://cdn.example.com");
    expect(
      managedAssetFromUrl(
        "https://cdn.example.com/track-assets/a%20b/file.mp3",
      ),
    ).toEqual({ bucket: "track-assets", path: "a b/file.mp3" });
    expect(managedAssetFromUrl("https://example.com/file.mp3")).toBeNull();
    expect(
      managedAssetFromUrl("https://cdn.example.com/track-assets/%E0%A4%A"),
    ).toBeNull();
  });
});
