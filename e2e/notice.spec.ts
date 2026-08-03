import { test, expect } from "@playwright/test";

test.describe("Public Notice Pages", () => {
  test("renders notice list page", async ({ page }) => {
    await page.goto("/notice");
    await expect(page).toHaveTitle(/Notice/i);
    await expect(page.locator("body")).toBeVisible();
  });
});
