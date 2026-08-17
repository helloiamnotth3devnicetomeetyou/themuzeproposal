import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePublicCache = vi.hoisted(() => vi.fn());
vi.mock("@/core/utils/public-cache", () => ({ revalidatePublicCache }));

import { notifyArtistsChanged } from "./artist-events";

describe("notifyArtistsChanged", () => {
  beforeEach(() => {
    revalidatePublicCache.mockReset();
    vi.stubGlobal("window", { dispatchEvent: vi.fn() });
  });

  it("invalidates every artist-dependent public cache", async () => {
    await notifyArtistsChanged();

    expect(revalidatePublicCache).toHaveBeenCalledWith(
      "public-navigation-artists",
      "public-home-slides",
      "artist-scene-data",
      "public-artist-title",
      "public-member-title",
      "public-discography",
      "public-artist-schedule",
      "public-notices",
      "public-notice-title",
    );
  });
});
