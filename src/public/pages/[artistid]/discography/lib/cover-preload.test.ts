import { describe, expect, it } from "vitest";
import { coverPreloadQueue, galleryPreloadQueue } from "./cover-preload";

describe("coverPreloadQueue", () => {
  it("prioritizes covers next to the active album", () => {
    const queue = coverPreloadQueue(
      [{ src: "a" }, { src: "b" }, { src: "c" }, { src: "d" }],
      1,
    );
    expect(queue.map((candidate) => candidate.src)).toEqual(["a", "c"]);
  });

  it("preloads only the selected album's member images", () => {
    const item = (id: string, albumId: string) => ({
      id,
      albumId,
      imageUrl: `/images/${id}.jpg`,
      caption: "",
      sortOrder: 1,
    });
    const queue = galleryPreloadQueue(
      [item("a", "album-a"), item("b", "album-b")],
      "album-a",
    );
    expect(queue).toHaveLength(1);
    expect(queue[0].src).toContain("a.jpg");
  });
});
