import { beforeEach, describe, it, expect, vi } from "vitest";

const publicClient = vi.hoisted(() => ({ from: vi.fn() }));

// These pure functions don't use DB/server-only – they only depend on localizeText
// We must mock server-only and supabase imports to prevent import errors in test env.
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => publicClient),
}));
vi.mock("@/core/config/public-env", () => ({
  getPublicSupabaseConfig: () => ({
    url: "https://test.supabase.co",
    anonKey: "test-key",
  }),
}));

import {
  displayName,
  getPublicArtistTitle,
  getPublicMemberTitle,
  getPublicNoticeTitle,
  noticeDisplayTitle,
  pageTypeLabel,
} from "./server";

function failedQuery(error: Error) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error }),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  return query;
}

describe("cached public reads", () => {
  beforeEach(() => publicClient.from.mockReset());

  it("does not cache artist title query failures as not found", async () => {
    const error = new Error("temporary database failure");
    publicClient.from.mockReturnValue(failedQuery(error));

    await expect(getPublicArtistTitle("artist")).rejects.toBe(error);
  });

  it("does not cache member title query failures as not found", async () => {
    const error = new Error("temporary database failure");
    publicClient.from.mockReturnValue(failedQuery(error));

    await expect(getPublicMemberTitle("artist", "member")).rejects.toBe(
      error,
    );
  });

  it("does not cache notice title query failures as not found", async () => {
    const error = new Error("temporary database failure");
    publicClient.from.mockReturnValue(failedQuery(error));

    await expect(getPublicNoticeTitle("notice")).rejects.toBe(error);
  });
});

describe("seo/server pure functions", () => {
  describe("displayName", () => {
    it("returns null for null entity", () => {
      expect(displayName(null, "ko")).toBeNull();
    });

    it("returns localized name_ko for ko locale", () => {
      const entity = {
        name: "RESCENE",
        eng_name: null,
        name_ko: "리센느",
        name_en: "RESCENE",
        name_ja: null,
      };
      expect(displayName(entity, "ko")).toBe("리센느");
    });

    it("falls back to eng_name for en locale when name_en is null", () => {
      const entity = {
        name: "RESCENE",
        eng_name: "RESCENE ENG",
        name_ko: null,
        name_en: null,
        name_ja: null,
      };
      expect(displayName(entity, "en")).toBe("RESCENE ENG");
    });

    it("falls back to name when all localized fields are null", () => {
      const entity = {
        name: "RESCENE",
        eng_name: null,
        name_ko: null,
        name_en: null,
        name_ja: null,
      };
      // localizeText falls through to the fallback
      const result = displayName(entity, "en");
      expect(result).toBeTruthy();
    });

    it("returns null when all fields are null/empty", () => {
      const entity = {
        name: "",
        eng_name: null,
        name_ko: null,
        name_en: null,
        name_ja: null,
      };
      expect(displayName(entity, "ko")).toBeNull();
    });
  });

  describe("noticeDisplayTitle", () => {
    it("returns null for null notice", () => {
      expect(noticeDisplayTitle(null, "ko")).toBeNull();
    });

    it("returns ko title for ko locale", () => {
      const notice = {
        title_ko: "이벤트 공지",
        title_en: "Event Notice",
        title_ja: null,
      };
      expect(noticeDisplayTitle(notice, "ko")).toBe("이벤트 공지");
    });

    it("returns en title for en locale", () => {
      const notice = {
        title_ko: "이벤트 공지",
        title_en: "Event Notice",
        title_ja: null,
      };
      expect(noticeDisplayTitle(notice, "en")).toBe("Event Notice");
    });

    it("returns null when all titles are empty", () => {
      const notice = { title_ko: "", title_en: "", title_ja: "" };
      expect(noticeDisplayTitle(notice, "ko")).toBeNull();
    });
  });

  describe("pageTypeLabel", () => {
    it("returns correct Korean labels", () => {
      expect(pageTypeLabel("artist", "ko")).toBe("아티스트");
      expect(pageTypeLabel("discography", "ko")).toBe("디스코그래피");
      expect(pageTypeLabel("schedule", "ko")).toBe("일정");
      expect(pageTypeLabel("notices", "ko")).toBe("공지");
      expect(pageTypeLabel("notice", "ko")).toBe("공지");
    });

    it("returns correct English labels", () => {
      expect(pageTypeLabel("artist", "en")).toBe("Artist");
      expect(pageTypeLabel("discography", "en")).toBe("Discography");
      expect(pageTypeLabel("schedule", "en")).toBe("Schedule");
      expect(pageTypeLabel("notices", "en")).toBe("Notices");
    });

    it("returns correct Japanese labels", () => {
      expect(pageTypeLabel("artist", "ja")).toBe("アーティスト");
      expect(pageTypeLabel("discography", "ja")).toBe("ディスコグラフィー");
    });
  });
});
