import { test, expect } from "@playwright/test";

test.describe("Artist Scene Experience", () => {
  test("redirects /artists to /rescene/artist", async ({ page }) => {
    await page.goto("/artists");
    await expect(page).toHaveURL(/\/rescene\/artist/);
  });

  test("loads artist scene page for rescene", async ({ page }) => {
    await page.goto("/rescene");
    await expect(page.locator("body")).toBeVisible();
  });
});
