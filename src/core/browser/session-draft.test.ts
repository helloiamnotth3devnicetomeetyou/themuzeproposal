// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import {
  readSessionDraft,
  removeSessionDraft,
  writeSessionDraft,
} from "./session-draft";

describe("session drafts", () => {
  it("ignores invalid or unavailable storage", () => {
    sessionStorage.setItem("draft", "not-json");
    expect(readSessionDraft("draft")).toBeNull();

    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("full");
      });
    expect(() => writeSessionDraft("draft", { value: "saved" })).not.toThrow();
    setItem.mockRestore();
    removeSessionDraft("draft");
  });
});
