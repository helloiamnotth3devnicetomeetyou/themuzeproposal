// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseFormDataWithinLimit, parseJsonWithinLimit } from "./request-body";

describe("parseFormDataWithinLimit", () => {
  afterEach(() => vi.restoreAllMocks());
  it("stops reading an oversized body", async () => {
    const request = new Request("https://themuze.kr/upload", {
      method: "POST",
      body: new Uint8Array(11),
    });

    await expect(parseFormDataWithinLimit(request, 10)).resolves.toBeNull();
  });

  it("limits streamed JSON without relying on Content-Length", async () => {
    const oversized = new Request("https://themuze.kr/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('{"value":"1234567890"}')); controller.close(); } }),
      duplex: "half",
    } as RequestInit);
    const valid = new Request("https://themuze.kr/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: "ok" }),
    });

    await expect(parseJsonWithinLimit(oversized, 10)).rejects.toThrow();
    await expect(parseJsonWithinLimit(valid, 64)).resolves.toEqual({ value: "ok" });
  });

  it("does not let one multipart parse block another request", async () => {
    let release!: () => void;
    vi.spyOn(Response.prototype, "formData")
      .mockImplementationOnce(() => new Promise<FormData>((resolve) => {
        release = () => resolve(new FormData());
      }))
      .mockResolvedValueOnce(new FormData());
    const first = parseFormDataWithinLimit(new Request("https://themuze.kr/upload", { method: "POST" }), 10);

    await expect(parseFormDataWithinLimit(new Request("https://themuze.kr/upload", { method: "POST" }), 10)).resolves.toBeInstanceOf(FormData);
    release();
    await expect(first).resolves.toBeInstanceOf(FormData);
  });

  it("cancels a stalled multipart body after the read deadline", async () => {
    const cancel = vi.fn();
    const request = new Request("https://themuze.kr/upload", {
      method: "POST",
      body: new ReadableStream<Uint8Array>({
        start(controller) { controller.enqueue(new Uint8Array([1])); },
        cancel,
      }),
      duplex: "half",
    } as RequestInit);
    vi.spyOn(Response.prototype, "formData").mockImplementationOnce(async function readUntilClosed(this: Response) {
      const reader = this.body!.getReader();
      while (!(await reader.read()).done) { /* wait for EOF or timeout */ }
      return new FormData();
    });

    await expect(parseFormDataWithinLimit(request, 10, 20)).resolves.toBeNull();
    expect(cancel).toHaveBeenCalledOnce();
  });
});
