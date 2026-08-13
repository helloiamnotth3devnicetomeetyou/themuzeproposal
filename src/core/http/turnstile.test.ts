// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { verifyTurnstileToken } from "./turnstile";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it("accepts a localhost token in development", async () => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("TURNSTILE_SECRET_KEY", "test-secret");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://themuzeproposal.notth3.dev");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ success: true, action: "login", hostname: "localhost" }),
      ),
    ),
  );

  await expect(
    verifyTurnstileToken(
      "token",
      new NextRequest("http://localhost:3000/api/auth/login"),
      { action: "login" },
    ),
  ).resolves.toBe(true);
});
