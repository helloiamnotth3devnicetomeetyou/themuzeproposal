import { describe, expect, it } from "vitest";
import { newestAlbumsFirst } from "./album-order";
import type { DiscographyAlbum } from "./types";

const album = (id: string, releaseDate: string): DiscographyAlbum => ({
  id,
  title: id,
  titles: {},
  type: "",
  releaseDate,
  cover: "",
  color: "",
  tracks: [],
  desc: { ko: "", en: "", ja: "" },
  links: {},
});

describe("newestAlbumsFirst", () => {
  it("returns URL and playback lookup order without mutating fetched albums", () => {
    const fetched = [album("old", "2025-01-01"), album("new", "2026-01-01")];
    expect(newestAlbumsFirst(fetched).map((item) => item.id)).toEqual([
      "new",
      "old",
    ]);
    expect(fetched.map((item) => item.id)).toEqual(["old", "new"]);
  });
});
