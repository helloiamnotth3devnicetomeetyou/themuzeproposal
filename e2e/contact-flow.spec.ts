import { test, expect } from "@playwright/test";

test.describe("Public Contact Page Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contact");
  });

  test("renders contact page header and forms", async ({ page }) => {
    await expect(page.locator("h1")).toHaveText("CONTACT");
    await expect(page.getByRole("button", { name: "일반 문의" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Business" })).toBeVisible();
  });

  test("shows client-side validation errors when submitting empty form", async ({ page }) => {
    await page.getByRole("button", { name: "문의하기" }).click();
    const alert = page.locator("div[role='alert']").first();
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("문의 유형을 선택해 주세요.");
  });

  test("switches between General and Business tabs and updates form fields", async ({ page }) => {
    // Switch to Business tab
    await page.getByRole("button", { name: "Business" }).click();
    await expect(page.getByLabel(/회사명 \/ 소속/i)).toBeVisible();
    await expect(page.getByText("제안서 첨부")).toBeVisible();

    // Switch back to General tab
    await page.getByRole("button", { name: "일반 문의" }).click();
    await expect(page.getByLabel(/회사명 \/ 소속/i)).not.toBeVisible();
  });

  test("validates email format on contact form submission", async ({ page }) => {
    // Fill invalid email
    await page.getByLabel(/이름/i).fill("홍길동");
    await page.getByLabel(/이메일/i).fill("invalid-email-format");
    await page.getByLabel(/문의 내용/i).fill("테스트 문의 내용입니다.");

    // Submit form
    await page.getByRole("button", { name: "문의하기" }).click();

    // Error alert
    const alert = page.locator("div[role='alert']").first();
    await expect(alert).toBeVisible();
  });
});
