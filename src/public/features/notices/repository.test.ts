import { describe, it, expect, vi } from "vitest";
import { getPublicNotices, getPublicNotice, getPublicNoticeNavigation } from "./repository";

/**
 * Creates a supabase mock that faithfully reflects the real query chains:
 *   notices: .select().eq().order().eq|is() → data
 *   notices detail: .select().eq().eq().is|eq().maybeSingle() → data
 *   artists: .select().eq().eq().single() → artistData
 */
function makeChain(resolvedValue: unknown) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.select = self;
  chain.eq = self;
  chain.is = self;
  chain.order = self;
  chain.maybeSingle = () => Promise.resolve(resolvedValue);
  chain.single = () => Promise.resolve(resolvedValue);
  // make it thenable so `await query` (no .maybeSingle) also works
  chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve(resolvedValue).then(resolve);
  return chain;
}

function createMockSupabase(noticeRows: Record<string, unknown>[] = [], artistData: Record<string, unknown> | null = null) {
  return {
    from: vi.fn((table: string) => {
      if (table === "artists") {
        return makeChain({ data: artistData, error: artistData ? null : new Error("Not found") });
      }
      return makeChain({ data: noticeRows, error: null });
    }),
  } as unknown as Parameters<typeof getPublicNotices>[0];
}

const makeRow = (id: string, title_ko = "공지", category_ko = "일반"): Record<string, unknown> => ({
  id,
  date: "2026-01-01",
  title_ko,
  title_en: "Notice",
  title_ja: "お知らせ",
  content_ko: "내용",
  content_en: "Content",
  content_ja: "内容",
  category_ko,
  category_en: "General",
  category_ja: "一般",
});

describe("Notices Repository", () => {
  describe("getPublicNotices", () => {
    it("fetches global notices without artist slug", async () => {
      const supabase = createMockSupabase([makeRow("1", "공지사항")]);
      const result = await getPublicNotices(supabase);
      expect(result.name).toBe("");
      expect(result.notices.length).toBe(1);
      expect(result.notices[0].title.ko).toBe("공지사항");
      expect(result.notices[0].category.en).toBe("General");
      expect(result.notices[0]).not.toHaveProperty("content");
    });

    it("returns an empty notice list when no data", async () => {
      const supabase = createMockSupabase([]);
      const result = await getPublicNotices(supabase);
      expect(result.notices).toEqual([]);
    });

    it("maps multiple rows correctly", async () => {
      const supabase = createMockSupabase([makeRow("1", "첫번째"), makeRow("2", "두번째")]);
      const result = await getPublicNotices(supabase);
      expect(result.notices.length).toBe(2);
      expect(result.notices[1].title.ko).toBe("두번째");
    });

    it("fetches artist-scoped notices when artistSlug given", async () => {
      const artist = { id: "artist-id-1", name: "RESCENE", eng_name: "RESCENE" };
      const supabase = createMockSupabase([makeRow("10", "리센느 공지")], artist);
      const result = await getPublicNotices(supabase, "rescene");
      expect(result.name).toBe("RESCENE");
      expect(result.notices[0].title.ko).toBe("리센느 공지");
    });

    it("throws when artist is not found", async () => {
      const supabase = createMockSupabase([], null);
      await expect(getPublicNotices(supabase, "unknown-artist")).rejects.toThrow();
    });
  });

  describe("getPublicNotice", () => {
    it("fetches single notice detail", async () => {
      // Single-row fetch: mock returns the single row object via maybeSingle
      const rowData = makeRow("10", "상세 공지", "공지");
      // Override to return a single row not an array
      const mock = {
        from: vi.fn(() => makeChain({ data: rowData, error: null })),
      } as unknown as Parameters<typeof getPublicNotice>[0];

      const result = await getPublicNotice(mock, "10");
      expect(result.notice).not.toBeNull();
      expect(result.notice?.id).toBe("10");
      expect(result.notice?.title.ko).toBe("상세 공지");
    });

    it("returns null notice when id not found", async () => {
      const mock = {
        from: vi.fn(() => makeChain({ data: null, error: null })),
      } as unknown as Parameters<typeof getPublicNotice>[0];

      const result = await getPublicNotice(mock, "nonexistent");
      expect(result.notice).toBeNull();
    });

    it("handles null date gracefully", async () => {
      const rowData = { ...makeRow("99"), date: null };
      const mock = {
        from: vi.fn(() => makeChain({ data: rowData, error: null })),
      } as unknown as Parameters<typeof getPublicNotice>[0];

      const result = await getPublicNotice(mock, "99");
      expect(result.notice?.date).toBe("");
    });
  });

  it("returns adjacent notices with localized titles", async () => {
    const supabase = createMockSupabase([makeRow("new", "New"), makeRow("current", "Current"), makeRow("old", "Old")]);
    const result = await getPublicNoticeNavigation(supabase, "current");

    expect(result.previous).toMatchObject({ id: "old", title: { ko: "Old" } });
    expect(result.next).toMatchObject({ id: "new", title: { ko: "New" } });
  });
});
