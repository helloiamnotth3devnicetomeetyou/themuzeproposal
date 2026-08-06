import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  single: vi.fn(),
}));

vi.mock("@/core/supabase/client", () => ({
  supabase: { auth: { getUser: mocks.getUser }, from: mocks.from },
}));

import { AuthUserError, signIn, updateUserAvatar } from "./auth";

describe("signIn", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("preserves the server retry interval for a rate-limited login", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ code: "RATE_LIMITED" }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "125",
        },
      },
    )));

    await expect(signIn("user@example.com", "password")).rejects.toMatchObject({
      name: "AuthUserError",
      code: "RATE_LIMITED",
      retryAfterSeconds: 125,
    } satisfies Partial<AuthUserError>);
  });

  it("uses the service-unavailable fallback for a malformed error response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not-json", {
      status: 503,
    })));

    await expect(signIn("user@example.com", "password")).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
      retryAfterSeconds: undefined,
    });
  });
});

describe("updateUserAvatar", () => {
  it("returns the database-normalized fallback selection", async () => {
    const avatarChanged = vi.fn();
    window.addEventListener("account-avatar-changed", avatarChanged);
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mocks.from.mockReturnValue({ update: mocks.update });
    mocks.update.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockReturnValue({ select: mocks.select });
    mocks.select.mockReturnValue({ single: mocks.single });
    mocks.single.mockResolvedValue({ data: { avatar_asset_id: null }, error: null });

    await expect(updateUserAvatar("inactive-avatar")).resolves.toBeNull();
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ avatar_asset_id: "inactive-avatar" }));
    expect(avatarChanged).toHaveBeenCalledOnce();
    window.removeEventListener("account-avatar-changed", avatarChanged);
  });
});
