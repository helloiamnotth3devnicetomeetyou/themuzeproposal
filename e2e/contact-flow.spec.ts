import { test, expect } from "@playwright/test";

test.describe("Contact Page Access Flow", () => {
  test("unauthenticated user accessing /contact is redirected to login", async ({ page }) => {
    await page.goto("/contact");
    await expect(page).toHaveURL(/\/login\?redirect=%2Fcontact|\/login\?redirect=\/contact/);
  });
});
