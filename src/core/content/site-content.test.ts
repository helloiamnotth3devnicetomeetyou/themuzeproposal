import { describe, it, expect } from "vitest";
import {
  normalizeHistory,
  sortHistoryNewestFirst,
  DEFAULT_HISTORY,
  type HistoryEntry,
} from "./site-content";

describe("site-content", () => {
  describe("sortHistoryNewestFirst", () => {
    it("sorts entries by date descending", () => {
      const entries: HistoryEntry[] = [
        { id: "a", date: "2020. 01", event_ko: "", event_en: "", event_ja: "" },
        { id: "b", date: "2024. 03", event_ko: "", event_en: "", event_ja: "" },
        { id: "c", date: "2026. 07", event_ko: "", event_en: "", event_ja: "" },
      ];
      const sorted = sortHistoryNewestFirst(entries);
      expect(sorted[0].id).toBe("c");
      expect(sorted[1].id).toBe("b");
      expect(sorted[2].id).toBe("a");
    });

    it("does not mutate the original array", () => {
      const entries: HistoryEntry[] = [
        { id: "x", date: "2020. 01", event_ko: "", event_en: "", event_ja: "" },
      ];
      const original = [...entries];
      sortHistoryNewestFirst(entries);
      expect(entries).toEqual(original);
    });
  });

  describe("normalizeHistory", () => {
    it("returns DEFAULT_HISTORY when value is not an array", () => {
      expect(normalizeHistory(null)).toBe(DEFAULT_HISTORY);
      expect(normalizeHistory(undefined)).toBe(DEFAULT_HISTORY);
      expect(normalizeHistory("string")).toBe(DEFAULT_HISTORY);
      expect(normalizeHistory(42)).toBe(DEFAULT_HISTORY);
    });

    it("parses valid history entries and sorts newest first", () => {
      const raw = [
        {
          id: "e1",
          date: "2020. 01",
          event_ko: "설립",
          event_en: "Founded",
          event_ja: "設立",
        },
        {
          id: "e2",
          date: "2024. 03",
          event_ko: "데뷔",
          event_en: "Debut",
          event_ja: "デビュー",
        },
      ];
      const result = normalizeHistory(raw);
      expect(result[0].id).toBe("e2");
      expect(result[1].id).toBe("e1");
    });

    it("skips non-object items in array", () => {
      const result = normalizeHistory([
        null,
        "invalid",
        42,
        {
          id: "ok",
          date: "2024. 01",
          event_ko: "k",
          event_en: "e",
          event_ja: "j",
        },
      ]);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe("ok");
    });

    it("generates fallback id when id is missing", () => {
      const result = normalizeHistory([
        { date: "2024. 01", event_ko: "k", event_en: "e", event_ja: "j" },
      ]);
      expect(result[0].id).toBe("history-0");
    });
  });
});
