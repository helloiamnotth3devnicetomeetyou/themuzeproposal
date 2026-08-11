import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createSupabaseServerClient: vi.fn(), getAll: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("next/headers", () => ({ cookies: () => ({ getAll: mocks.getAll }) }));
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn(() => ({ from: vi.fn() })) }));
vi.mock("@/core/config/public-env", () => ({
  getPublicSupabaseConfig: () => ({ url: "https://test.supabase.co", anonKey: "test-key", projectRef: "test" }),
}));
vi.mock("@/core/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));

import { getNavigationAccount } from "./server";

function query(data: unknown) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({ data }),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  return builder;
}

describe("getNavigationAccount", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.getAll.mockReturnValue([]); });

  it("does not query profile data for anonymous visitors", async () => {
    const from = vi.fn();
    mocks.createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      from,
    });

    await expect(getNavigationAccount()).resolves.toMatchObject({ isLoggedIn: false, isAdmin: false });
    expect(from).not.toHaveBeenCalled();
  });

  it("returns the logged-in profile and avatar without exposing the client SDK", async () => {
    mocks.getAll.mockReturnValue([{ name: "sb-test-auth-token" }]);
    const profile = query({ role: "editor", name: "Editor", avatar_asset_id: "avatar-1" });
    const avatar = query({ image_path: "avatars/editor.webp" });
    mocks.createSupabaseServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "editor@example.com", user_metadata: {} } } }) },
      from: vi.fn((table: string) => table === "profiles" ? profile : avatar),
      storage: { from: vi.fn(() => ({ getPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://cdn.example/editor.webp" } })) })) },
    });

    await expect(getNavigationAccount()).resolves.toEqual({
      isLoggedIn: true,
      isAdmin: true,
      avatarUrl: "https://cdn.example/editor.webp",
      initial: "E",
      name: "Editor",
    });
  });
});
