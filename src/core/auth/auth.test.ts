import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/core/supabase/client", () => ({ supabase: {} }));

import { AuthUserError, signIn } from "./auth";

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
