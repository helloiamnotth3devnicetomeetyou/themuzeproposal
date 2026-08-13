import { describe, expect, it } from "vitest";
import { safeHref } from "./safe-href";

describe("safeHref", () => {
  it("accepts absolute HTTP(S) URLs", () => {
    expect(safeHref(" https://example.com/watch?v=1 ")).toBe(
      "https://example.com/watch?v=1",
    );
    expect(safeHref("http://example.com/audio.mp3")).toBe(
      "http://example.com/audio.mp3",
    );
  });

  it("rejects executable, relative, and malformed URLs", () => {
    expect(safeHref("javascript:alert(1)")).toBeUndefined();
    expect(
      safeHref("data:text/html,<script>alert(1)</script>"),
    ).toBeUndefined();
    expect(safeHref("/internal/path")).toBeUndefined();
    expect(safeHref("not a url")).toBeUndefined();
  });
});
