import { describe, expect, it } from "vitest";
import {
  duplicateNoticeDraft,
  resolvePublishedAt,
  type NoticeDraft,
} from "./notice-editor-model";

describe("duplicateNoticeDraft", () => {
  it("keeps content but starts as an unpublished unsaved draft", () => {
    const source: NoticeDraft = {
      id: "notice-1",
      titleKo: "공지",
      titleEn: "Notice",
      titleJa: "お知らせ",
      contentKo: "<p>본문</p>",
      contentEn: "<p>Body</p>",
      contentJa: "<p>本文</p>",
      categoryKo: "공지",
      categoryEn: "Notice",
      categoryJa: "お知らせ",
      date: "2026-08-11",
      published: true,
    };
    expect(duplicateNoticeDraft(source)).toEqual({
      ...source,
      id: null,
      published: false,
    });
  });
});

describe("resolvePublishedAt", () => {
  it("keeps an existing publication timestamp while published", () => {
    expect(
      resolvePublishedAt(
        true,
        "2026-08-01T00:00:00.000Z",
        "2026-08-13T00:00:00.000Z",
      ),
    ).toBe("2026-08-01T00:00:00.000Z");
  });

  it("assigns a timestamp only when publishing a row without one", () => {
    expect(resolvePublishedAt(true, null, "2026-08-13T00:00:00.000Z")).toBe(
      "2026-08-13T00:00:00.000Z",
    );
    expect(resolvePublishedAt(false, "2026-08-01T00:00:00.000Z")).toBeNull();
  });
});
