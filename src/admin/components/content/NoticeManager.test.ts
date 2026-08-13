import { describe, expect, it } from "vitest";
import { duplicateNoticeDraft, type NoticeDraft } from "./notice-editor-model";

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
