// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  signUp: vi.fn(),
  from: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  single: vi.fn(),
}));

vi.mock("@/core/supabase/client", () => ({
  supabase: {
    auth: { getUser: mocks.getUser, signUp: mocks.signUp },
    from: mocks.from,
  },
}));

import {
  AuthUserError,
  getUserProfile,
  signIn,
  signUp,
  updateUserAvatar,
} from "./auth";

describe("signIn", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("preserves the server retry interval for a rate-limited login", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: "RATE_LIMITED" }), {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "125",
          },
        }),
      ),
    );

    await expect(
      signIn("user@example.com", "password", "captcha-token"),
    ).rejects.toMatchObject({
      name: "AuthUserError",
      code: "RATE_LIMITED",
      retryAfterSeconds: 125,
    } satisfies Partial<AuthUserError>);
  });

  it("uses the service-unavailable fallback for a malformed error response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("not-json", {
          status: 503,
        }),
      ),
    );

    await expect(
      signIn("user@example.com", "password", "captcha-token"),
    ).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
      retryAfterSeconds: undefined,
    });
  });
});

describe("signUp", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not query an account's identity provider when signup returns no identities", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    mocks.signUp.mockResolvedValue({
      data: { user: { identities: [] } },
      error: null,
    });

    await expect(
      signUp("user@example.com", "ValidPass123!", "captcha-token"),
    ).rejects.toMatchObject({
      code: "SIGNUP_FAILED",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("reports Supabase signup throttling as rate-limited", async () => {
    mocks.signUp.mockResolvedValue({
      data: { user: null },
      error: { status: 429 },
    });

    await expect(
      signUp("user@example.com", "ValidPass123!", "captcha-token"),
    ).rejects.toMatchObject({ code: "RATE_LIMITED" });
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
    mocks.single.mockResolvedValue({
      data: { avatar_asset_id: null },
      error: null,
    });

    await expect(updateUserAvatar("inactive-avatar")).resolves.toBeNull();
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ avatar_asset_id: "inactive-avatar" }),
    );
    expect(avatarChanged).toHaveBeenCalledOnce();
    window.removeEventListener("account-avatar-changed", avatarChanged);
  });
});

describe("getUserProfile", () => {
  it("selects only the profile fields used by the application", async () => {
    const profile = {
      id: "user-1",
      email: "user@example.com",
      name: "User",
      role: "editor",
      avatar_asset_id: null,
    };
    mocks.from.mockReturnValue({ select: mocks.select });
    mocks.select.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockReturnValue({ single: mocks.single });
    mocks.single.mockResolvedValue({ data: profile });

    await expect(getUserProfile("user-1")).resolves.toEqual(profile);
    expect(mocks.select).toHaveBeenCalledWith(
      "id,email,name,role,avatar_asset_id",
    );
  });
});
