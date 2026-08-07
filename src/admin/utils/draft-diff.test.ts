import { describe, expect, it } from "vitest";
import { buildDraftDiff, formatDraftPeek } from "./draft-diff";

describe("buildDraftDiff", () => {
  it("classifies additions, deletions, changes and order changes", () => {
    expect(buildDraftDiff(
      { title: "전", note: "삭제", image: "", items: [{ id: "a" }, { id: "b" }] },
      { title: "후", note: "", image: "/new.jpg", items: [{ id: "b" }, { id: "a" }] },
    ).map(({ kind, field }) => [kind, field])).toEqual([
      ["change", "제목"],
      ["delete", "note"],
      ["add", "image"],
      ["order", "items"],
    ]);
  });

  it("shows administrator-facing labels instead of database keys", () => {
    expect(buildDraftDiff(
      { release_date: "2026-01-01", is_published: false, title_ko: "전" },
      { release_date: "2026-02-01", is_published: true, title_ko: "후" },
    ).map(({ field }) => field)).toEqual(["발매일", "공개 상태", "제목 (한국어)"]);
  });

  it("summarizes a root list without exposing numeric indexes", () => {
    expect(buildDraftDiff([{ id: "a" }, { id: "b" }], [{ id: "b" }, { id: "a" }])).toEqual([
      { kind: "order", field: "목록", before: "2개", after: "2개" },
    ]);
  });

  it("formats a compact navigation warning peek", () => {
    expect(formatDraftPeek([{ kind: "change", field: "제목", before: "전", after: "후" }])).toBe("• 제목: 전 → 후");
  });
});
