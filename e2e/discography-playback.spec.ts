import { test, expect } from "@playwright/test";

test.describe("Discography Playback", () => {
  test("redirects /discography to /rescene/discography", async ({ page }) => {
    await page.goto("/discography");
    await expect(page).toHaveURL(/\/rescene\/discography/);
  });

  test("loads discography page and displays experience UI", async ({ page }) => {
    await page.goto("/rescene/discography");
    await expect(page.locator("body")).toBeVisible();
  });
});
