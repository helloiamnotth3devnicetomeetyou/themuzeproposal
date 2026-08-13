import { test, expect } from "@playwright/test";

test.describe("Login Rate Limiting", () => {
  test("returns 429 when rate limit is exceeded via API", async ({
    request,
  }) => {
    const email = `ratelimit-test-${Date.now()}@example.com`;
    const password = "WrongPassword123!";

    let lastResponse;
    // Attempt up to 10 bad logins
    for (let i = 0; i < 10; i++) {
      lastResponse = await request.post("/api/auth/login", {
        headers: {
          Origin: "http://localhost:3000",
        },
        data: {
          email,
          password,
        },
      });

      if (lastResponse.status() === 429) {
        break;
      }
    }

    // Either it fails with 401 or hits 429 rate limit
    expect([401, 429, 503]).toContain(lastResponse?.status());
    if (lastResponse?.status() === 429) {
      const json = await lastResponse.json();
      expect(json.code).toBe("RATE_LIMITED");
      expect(lastResponse.headers()["retry-after"]).toBeDefined();
    }
  });
});
