// @vitest-environment node
import { describe, expect, it } from "vitest";
import { parseFormDataWithinLimit } from "./request-body";

describe("parseFormDataWithinLimit", () => {
  it("stops reading an oversized body", async () => {
    const request = new Request("https://themuze.kr/upload", {
      method: "POST",
      body: new Uint8Array(11),
    });

    await expect(parseFormDataWithinLimit(request, 10)).resolves.toBeNull();
  });
});
