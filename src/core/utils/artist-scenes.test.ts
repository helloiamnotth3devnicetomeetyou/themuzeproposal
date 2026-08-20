import { describe, expect, it } from "vitest";
import { scenesForMember, type ArtistScene } from "./artist-scenes";

const scene = (id: string, sort_order: number, memberOrder?: number): ArtistScene => ({
  id,
  artist_id: "artist",
  title: id,
  title_ko: null,
  title_en: null,
  title_ja: null,
  link_url: null,
  image_url: `/${id}.webp`,
  image_width: null,
  image_height: null,
  is_hero: false,
  is_published: true,
  sort_order,
  member_ids: ["member"],
  member_scene_orders: memberOrder === undefined ? {} : { member: memberOrder },
  artist_scene_members: [],
});

describe("scenesForMember", () => {
  it("uses the member order without changing the global fallback order", () => {
    expect(
      scenesForMember([scene("first", 0, 1), scene("second", 1, 0)], "member").map(
        (item) => item.id,
      ),
    ).toEqual(["second", "first"]);
  });
});
