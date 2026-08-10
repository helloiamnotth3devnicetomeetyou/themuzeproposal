import { test, expect } from "@playwright/test";

test.describe("Artist Scene Experience", () => {
  test("redirects /artists to /rescene/artist", async ({ request }) => {
    const response = await request.get("/artists", { maxRedirects: 0 });
    expect(response.status()).toBe(200);
    await expect(response.text()).resolves.toContain("/rescene/artist");
  });
});
