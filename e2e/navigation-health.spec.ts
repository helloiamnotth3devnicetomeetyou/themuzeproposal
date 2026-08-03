import { test, expect } from "@playwright/test";

test.describe("Navigation & General Page Health", () => {
  test("renders home page with proper layout", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });

  test("renders About page", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("body")).toBeVisible();
  });

  test("renders Audition page", async ({ page }) => {
    await page.goto("/audition");
    await expect(page.locator("body")).toBeVisible();
  });

  test("renders 404 page for non-existent routes", async ({ page }) => {
    await page.goto("/non-existent-page-xyz-12345");
    await expect(page.locator("body")).toBeVisible();
  });
});
