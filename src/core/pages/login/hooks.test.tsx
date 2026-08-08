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
    ) { super(code); }
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
    const { result } = renderHook(() => useLoginForm({ redirectTo: "/protect", oauthFailed: false, locale: "ko" }));
    act(() => { result.current.setEmail("user@example.com"); result.current.setPassword("secret"); });
    await act(async () => { await result.current.handleLogin({ preventDefault: vi.fn() } as never); });
    expect(auth.signIn).toHaveBeenCalledWith("user@example.com", "secret");
    expect(push).toHaveBeenCalledWith("/protect");
  });

  it("shows the remaining rate-limit wait in minutes", async () => {
    auth.signIn.mockRejectedValue(new AuthUserError("RATE_LIMITED", 125));
    const { result } = renderHook(() => useLoginForm({ redirectTo: "/", oauthFailed: false, locale: "ko" }));
    await act(async () => { await result.current.handleLogin({ preventDefault: vi.fn() } as never); });
    expect(result.current.error).toContain("약 3분 후");
  });

  it("explains invalid credentials separately from a service outage", async () => {
    auth.signIn.mockRejectedValueOnce(new AuthUserError("INVALID_CREDENTIALS"));
    const { result } = renderHook(() => useLoginForm({ redirectTo: "/", oauthFailed: false, locale: "ko" }));
    await act(async () => { await result.current.handleLogin({ preventDefault: vi.fn() } as never); });
    expect(result.current.error).toBe(result.current.t.invalidCredentials);

    auth.signIn.mockRejectedValueOnce(new AuthUserError("SERVICE_UNAVAILABLE"));
    await act(async () => { await result.current.handleLogin({ preventDefault: vi.fn() } as never); });
    expect(result.current.error).toBe(result.current.t.serviceUnavailable);
  });

  it("starts Google sign-in for Google-only accounts", async () => {
    auth.signIn.mockRejectedValueOnce(new AuthUserError("GOOGLE_SIGN_IN_REQUIRED"));
    auth.signInWithGoogle.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useLoginForm({ redirectTo: "/protect", oauthFailed: false, locale: "en" }));
    act(() => { result.current.setEmail("user@example.com"); result.current.setPassword("secret"); });

    await act(async () => { await result.current.handleLogin({ preventDefault: vi.fn() } as never); });

    expect(auth.signInWithGoogle).toHaveBeenCalledWith("/protect", "user@example.com");
  });

  it("rejects an invalid sign-up password before calling Supabase", async () => {
    const { result } = renderHook(() => useLoginForm({ redirectTo: "/", oauthFailed: false, locale: "en" }));
    act(() => { result.current.switchMode("signup"); result.current.setPassword("short"); result.current.setConfirmPassword("short"); });
    await act(async () => { await result.current.handleSignup({ preventDefault: vi.fn() } as never); });
    expect(auth.signUp).not.toHaveBeenCalled();
    expect(result.current.error).toBe(result.current.t.passwordLengthErr);
  });

  it("signs a newly registered user in and navigates immediately", async () => {
    auth.signUp.mockResolvedValue({ session: { access_token: "test" } });
    const { result } = renderHook(() => useLoginForm({ redirectTo: "/protect", oauthFailed: false, locale: "en" }));
    act(() => {
      result.current.switchMode("signup");
      result.current.setEmail("user@example.com");
      result.current.setPassword("password");
      result.current.setConfirmPassword("password");
    });
    await act(async () => { await result.current.handleSignup({ preventDefault: vi.fn() } as never); });
    expect(auth.signUp).toHaveBeenCalledWith("user@example.com", "password", "");
    expect(push).toHaveBeenCalledWith("/protect");
  });

  it("starts Google sign-in when sign-up finds a Google-only account", async () => {
    auth.signUp.mockRejectedValueOnce(new AuthUserError("GOOGLE_SIGN_IN_REQUIRED"));
    auth.signInWithGoogle.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useLoginForm({ redirectTo: "/protect", oauthFailed: false, locale: "en" }));
    act(() => {
      result.current.switchMode("signup");
      result.current.setEmail("user@example.com");
      result.current.setPassword("password");
      result.current.setConfirmPassword("password");
    });

    await act(async () => { await result.current.handleSignup({ preventDefault: vi.fn() } as never); });

    expect(auth.signInWithGoogle).toHaveBeenCalledWith("/protect", "user@example.com");
  });
});
