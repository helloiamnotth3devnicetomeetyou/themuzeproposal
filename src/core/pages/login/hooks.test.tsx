import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const auth = vi.hoisted(() => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  signInWithGoogle: vi.fn(),
  AuthUserError: class AuthUserError extends Error {
    constructor(public readonly code: string) { super(code); }
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

  it("shows a dedicated rate-limit message", async () => {
    auth.signIn.mockRejectedValue(new AuthUserError("RATE_LIMITED"));
    const { result } = renderHook(() => useLoginForm({ redirectTo: "/", oauthFailed: false, locale: "en" }));
    await act(async () => { await result.current.handleLogin({ preventDefault: vi.fn() } as never); });
    expect(result.current.error).toBe(result.current.t.rateLimited);
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
});
