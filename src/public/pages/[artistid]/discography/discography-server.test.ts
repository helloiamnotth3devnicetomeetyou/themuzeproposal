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

import { loadDiscography } from "./discography-server";

function query(result: unknown) {
  const builder = {
    select: vi.fn(), eq: vi.fn(), lte: vi.fn(), order: vi.fn(),
    maybeSingle: vi.fn(), overrideTypes: vi.fn(),
    then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.lte.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.maybeSingle.mockResolvedValue(result);
  builder.overrideTypes.mockResolvedValue(result);
  return builder;
}

describe("loadDiscography", () => {
  beforeEach(() => publicClient.from.mockReset());

  it("returns an error when the member query fails", async () => {
    publicClient.from.mockImplementation((table: string) =>
      query(
        table === "artists"
          ? { data: { id: "artist", name: "Artist" }, error: null }
          : table === "artist_members"
            ? { data: null, error: new Error("members unavailable") }
            : { data: [], error: null },
      ),
    );

    await expect(loadDiscography("artist")).resolves.toMatchObject({
      data: null,
      error: expect.any(String),
    });
  });
});
