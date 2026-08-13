import { test, expect } from "@playwright/test";

test.describe("Protect Report Page Access Flow", () => {
  test("unauthenticated user accessing /protect is redirected to login", async ({
    page,
  }) => {
    await page.goto("/protect");
    await expect(page).toHaveURL(
      /\/login\?redirect=%2Fprotect|\/login\?redirect=\/protect/,
    );
    await expect(page.getByRole("status")).toContainText(
      "로그인이 필요한 서비스입니다.",
    );
  });
});
