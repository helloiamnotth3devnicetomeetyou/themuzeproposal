// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const auth = vi.hoisted(() => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  signInWithGoogle: vi.fn(),
  AuthUserError: class AuthUserError extends Error {
    constructor(
      public readonly code: string,
      public readonly retryAfterSeconds?: number,
    ) {
      super(code);
    }
  },
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/core/auth/auth", () => auth);

import { AuthUserError } from "@/core/auth/auth";
import { useLoginForm } from "./hooks";

describe("useLoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it("signs in and navigates to the requested destination", async () => {
    auth.signIn.mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useLoginForm({
        redirectTo: "/protect",
        oauthFailed: false,
        locale: "ko",
      }),
    );
    act(() => {
      result.current.setEmail("user@example.com");
      result.current.setPassword("secret");
      result.current.setTurnstileToken("captcha-token");
    });
    await act(async () => {
      await result.current.handleLogin({ preventDefault: vi.fn() } as never);
    });
    expect(auth.signIn).toHaveBeenCalledWith(
      "user@example.com",
      "secret",
      "captcha-token",
    );
    expect(push).toHaveBeenCalledWith("/protect");
  });

  it("blocks sign-in until the security check is completed", async () => {
    const { result } = renderHook(() =>
      useLoginForm({ redirectTo: "/", oauthFailed: false, locale: "ko" }),
    );
    act(() => {
      result.current.setEmail("user@example.com");
      result.current.setPassword("secret");
    });
    await act(async () => {
      await result.current.handleLogin({ preventDefault: vi.fn() } as never);
    });
    expect(auth.signIn).not.toHaveBeenCalled();
    expect(result.current.error).toBe(result.current.t.captchaRequired);
  });

  it("shows the remaining rate-limit wait in minutes", async () => {
    auth.signIn.mockRejectedValue(new AuthUserError("RATE_LIMITED", 125));
    const { result } = renderHook(() =>
      useLoginForm({ redirectTo: "/", oauthFailed: false, locale: "ko" }),
    );
    act(() => {
      result.current.setTurnstileToken("captcha-token");
    });
    await act(async () => {
      await result.current.handleLogin({ preventDefault: vi.fn() } as never);
    });
    expect(result.current.error).toContain("약 3분 후");
  });

  it("explains invalid credentials separately from a service outage", async () => {
    auth.signIn.mockRejectedValueOnce(new AuthUserError("INVALID_CREDENTIALS"));
    const { result } = renderHook(() =>
      useLoginForm({ redirectTo: "/", oauthFailed: false, locale: "ko" }),
    );
    act(() => {
      result.current.setTurnstileToken("captcha-token");
    });
    await act(async () => {
      await result.current.handleLogin({ preventDefault: vi.fn() } as never);
    });
    expect(result.current.error).toBe(result.current.t.invalidCredentials);

    act(() => {
      result.current.setTurnstileToken("captcha-token-2");
    });
    auth.signIn.mockRejectedValueOnce(new AuthUserError("SERVICE_UNAVAILABLE"));
    await act(async () => {
      await result.current.handleLogin({ preventDefault: vi.fn() } as never);
    });
    expect(result.current.error).toBe(result.current.t.serviceUnavailable);
  });

  it("rejects an invalid sign-up password (too short) before calling Supabase", async () => {
    const { result } = renderHook(() =>
      useLoginForm({ redirectTo: "/", oauthFailed: false, locale: "en" }),
    );
    act(() => {
      result.current.switchMode("signup");
    });
    await act(async () => {
      await result.current.handleSignup({ preventDefault: vi.fn() } as never);
    });
    act(() => {
      result.current.setPassword("short");
    });
    await act(async () => {
      await result.current.handleSignup({ preventDefault: vi.fn() } as never);
    });
    expect(auth.signUp).not.toHaveBeenCalled();
    expect(result.current.error).toBe(result.current.t.passwordLengthErr);
  });

  it("rejects a weak sign-up password missing symbol/upper/digit", async () => {
    const { result } = renderHook(() =>
      useLoginForm({ redirectTo: "/", oauthFailed: false, locale: "en" }),
    );
    act(() => {
      result.current.switchMode("signup");
    });
    await act(async () => {
      await result.current.handleSignup({ preventDefault: vi.fn() } as never);
    });
    act(() => {
      result.current.setPassword("simplepassword");
    });
    await act(async () => {
      await result.current.handleSignup({ preventDefault: vi.fn() } as never);
    });
    expect(auth.signUp).not.toHaveBeenCalled();
    expect(result.current.error).toBe(result.current.t.passwordStrengthErr);
  });

  it("signs a newly registered user in and navigates immediately with valid password", async () => {
    auth.signUp.mockResolvedValue({ session: { access_token: "test" } });
    const { result } = renderHook(() =>
      useLoginForm({
        redirectTo: "/protect",
        oauthFailed: false,
        locale: "en",
      }),
    );
    act(() => {
      result.current.switchMode("signup");
      result.current.setEmail("user@example.com");
      result.current.setName("User");
    });
    await act(async () => {
      await result.current.handleSignup({ preventDefault: vi.fn() } as never);
    });
    act(() => {
      result.current.setPassword("ValidPass123!");
      result.current.setTurnstileToken("captcha-token");
    });
    await act(async () => {
      await result.current.handleSignup({ preventDefault: vi.fn() } as never);
    });
    expect(auth.signUp).toHaveBeenCalledWith(
      "user@example.com",
      "ValidPass123!",
      "captcha-token",
      "User",
    );
    expect(push).toHaveBeenCalledWith("/protect");
  });

  it("keeps a confirmation-required signup signed out and shows the email notice", async () => {
    auth.signUp.mockResolvedValue({ session: null });
    const { result } = renderHook(() =>
      useLoginForm({
        redirectTo: "/protect",
        oauthFailed: false,
        locale: "en",
      }),
    );
    act(() => {
      result.current.switchMode("signup");
      result.current.setEmail("user@example.com");
      result.current.setName("User");
    });
    await act(async () => {
      await result.current.handleSignup({ preventDefault: vi.fn() } as never);
    });
    act(() => {
      result.current.setPassword("ValidPass123!");
      result.current.setTurnstileToken("captcha-token");
    });
    await act(async () => {
      await result.current.handleSignup({ preventDefault: vi.fn() } as never);
    });

    expect(result.current.mode).toBe("login");
    expect(result.current.notice).toBe(result.current.t.confirmEmail);
    expect(push).not.toHaveBeenCalled();
  });

  it("explains a rate-limited signup", async () => {
    auth.signUp.mockRejectedValue(new AuthUserError("RATE_LIMITED"));
    const { result } = renderHook(() =>
      useLoginForm({ redirectTo: "/", oauthFailed: false, locale: "ko" }),
    );
    act(() => {
      result.current.switchMode("signup");
      result.current.setPassword("ValidPass123!");
      result.current.setTurnstileToken("captcha-token");
    });
    await act(async () => {
      await result.current.handleSignup({ preventDefault: vi.fn() } as never);
    });
    await act(async () => {
      await result.current.handleSignup({ preventDefault: vi.fn() } as never);
    });
    expect(result.current.error).toContain("1분 후");
  });
});
