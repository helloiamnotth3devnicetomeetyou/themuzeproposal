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
    expect(sessionStorage.getItem("draft")).toBeNull();

    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("full");
      });
    expect(() => writeSessionDraft("draft", { value: "saved" })).not.toThrow();
    setItem.mockRestore();
    removeSessionDraft("draft");
  });

  it("clears values with an invalid shape", () => {
    sessionStorage.setItem("draft", JSON.stringify([]));
    expect(readSessionDraft("draft")).toBeNull();
    expect(sessionStorage.getItem("draft")).toBeNull();

    const isDraft = (value: unknown): value is { version: number } =>
      Boolean(value) &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof (value as { version?: unknown }).version === "number" &&
      Number.isInteger((value as { version: number }).version) &&
      (value as { version: number }).version > 0;
    sessionStorage.setItem("draft", JSON.stringify({ version: "1" }));
    expect(readSessionDraft("draft", isDraft)).toBeNull();
    expect(sessionStorage.getItem("draft")).toBeNull();
  });
});
