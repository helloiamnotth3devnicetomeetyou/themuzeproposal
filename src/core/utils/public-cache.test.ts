import { beforeEach, describe, expect, it, vi } from "vitest";

const guideSandboxFetch = vi.hoisted(() => vi.fn());
vi.mock("@/core/supabase/guide-sandbox", () => ({ guideSandboxFetch }));

import { revalidatePublicCache } from "./public-cache";

describe("revalidatePublicCache", () => {
  beforeEach(() => guideSandboxFetch.mockReset());

  it("waits for immediate public cache invalidation", async () => {
    guideSandboxFetch.mockResolvedValue(new Response(null, { status: 200 }));
    await revalidatePublicCache("public-notices", "public-notice-title");
    expect(JSON.parse(guideSandboxFetch.mock.calls[0][1].body)).toEqual({ tags: ["public-notices", "public-notice-title"] });
  });

  it("fails when invalidation fails", async () => {
    guideSandboxFetch.mockResolvedValue(new Response(null, { status: 500 }));
    await expect(revalidatePublicCache("public-home-slides")).resolves.toBe(false);
  });
});
