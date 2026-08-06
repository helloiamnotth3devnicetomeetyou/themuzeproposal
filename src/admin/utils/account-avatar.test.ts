import { describe, expect, it, vi } from "vitest";

vi.mock("@/core/supabase/client", () => ({ supabase: {} }));

import { matchAccountAvatarPaths } from "./account-avatar";

describe("matchAccountAvatarPaths", () => {
  it("matches only active results returned by the asset query", () => {
    expect(matchAccountAvatarPaths(
      [{ id: "user-1", avatar_asset_id: "avatar-1" }, { id: "user-2", avatar_asset_id: null }],
      [{ id: "avatar-1", image_path: "artist/avatars/one.webp" }],
    )).toEqual({ "user-1": "artist/avatars/one.webp" });
  });
});
