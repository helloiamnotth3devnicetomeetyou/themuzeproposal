import { beforeEach, describe, expect, it, vi } from "vitest";

const publicClient = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => publicClient),
}));
vi.mock("@/core/config/public-env", () => ({
  getPublicSupabaseConfig: () => ({
    url: "https://test.supabase.co",
    anonKey: "test-key",
  }),
}));

import { getArtistSceneData } from "./artist-scene-server";

function failedQuery(error: Error) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error }),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  return query;
}

describe("getArtistSceneData", () => {
  beforeEach(() => publicClient.from.mockReset());

  it("does not cache a failed artist query as not found", async () => {
    const error = new Error("temporary database failure");
    publicClient.from.mockReturnValue(failedQuery(error));

    await expect(getArtistSceneData("artist")).rejects.toBe(error);
  });
});
