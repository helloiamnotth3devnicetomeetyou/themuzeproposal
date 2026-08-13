import { test, expect } from "@playwright/test";

test.describe("Contact Page Access Flow", () => {
  test("unauthenticated user can access /contact directly", async ({
    page,
  }) => {
    await page.goto("/contact");
    await expect(page).toHaveURL(/\/contact$/);
  });
});
