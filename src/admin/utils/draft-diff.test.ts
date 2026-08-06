import { describe, expect, it } from "vitest";
import { buildDraftDiff } from "./draft-diff";

describe("buildDraftDiff", () => {
  it("classifies additions, deletions, changes and order changes", () => {
    expect(buildDraftDiff(
      { title: "전", note: "삭제", image: "", items: [{ id: "a" }, { id: "b" }] },
      { title: "후", note: "", image: "/new.jpg", items: [{ id: "b" }, { id: "a" }] },
    ).map(({ kind, field }) => [kind, field])).toEqual([
      ["change", "title"],
      ["delete", "note"],
      ["add", "image"],
      ["order", "items"],
    ]);
  });
});
