import { describe, expect, it } from "vitest";
import { createHeroSlideDraft, getActiveHeroSlides } from "./hero-model";

describe("hero drafts", () => {
  it("keeps inactive records out of the queue and reactivates them only in a draft", () => {
    const inactive = {
      id: "old-slide",
      album_id: "album-1",
      sort_order: 2,
      is_active: false,
      video_url: null,
    };

    expect(getActiveHeroSlides([inactive])).toEqual([]);
    expect(createHeroSlideDraft([], [inactive], "album-1")).toEqual({
      ...inactive,
      sort_order: 1,
      is_active: true,
      video_url: null,
    });
  });
});
