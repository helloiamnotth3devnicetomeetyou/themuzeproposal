import { test, expect } from "@playwright/test";

test.describe("Discography Playback", () => {
  test("redirects /discography to /rescene/discography", async ({ request }) => {
    const response = await request.get("/discography", { maxRedirects: 0 });
    expect(response.status()).toBe(200);
    await expect(response.text()).resolves.toContain("/rescene/discography");
  });
});
