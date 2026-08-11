import { describe, expect, it } from "vitest";
import { coverPreloadQueue } from "./cover-preload";

describe("coverPreloadQueue", () => {
  it("prioritizes covers next to the active album", () => {
    const queue = coverPreloadQueue([{ src: "a" }, { src: "b" }, { src: "c" }, { src: "d" }], 1);
    expect(queue.map((candidate) => candidate.src)).toEqual(["a", "c"]);
  });
});
