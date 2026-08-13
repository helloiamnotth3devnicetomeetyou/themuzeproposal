import { describe, expect, it } from "vitest";
import {
  duplicateScheduleDraft,
  emptyScheduleDraft,
} from "./schedule-editor-model";

describe("duplicateScheduleDraft", () => {
  it("keeps the schedule fields but starts a private unsaved draft", () => {
    const source = {
      ...emptyScheduleDraft("2026-08-11"),
      id: "schedule-1",
      titleKo: "콘서트",
      isPublished: true,
    };
    expect(duplicateScheduleDraft(source)).toEqual({
      ...source,
      id: "",
      isPublished: false,
    });
  });
});
