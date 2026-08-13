import { test, expect } from "@playwright/test";
import { createMockFile } from "./helpers/test-helpers";

test.describe("Contact Inquiry & Protect Report File Validation API", () => {
  test("contact inquiry allows anonymous submission but rejects a missing captcha token", async ({
    request,
  }) => {
    const fakeJpg = createMockFile("jpg");

    const response = await request.post("/api/contact-inquiries", {
      headers: {
        Origin: "http://localhost:3000",
      },
      multipart: {
        category: "business",
        inquiryType: "brand_collaboration",
        companyName: "Test Co",
        contactName: "Tester",
        phone: "010-0000-0000",
        email: "test@example.com",
        message: "Hello test message",
        privacyConsent: "true",
        attachment: {
          name: "test.pdf",
          mimeType: "application/pdf",
          buffer: fakeJpg, // Mismatched file signature vs extension/mimetype
        },
      },
    });

    // /contact intentionally allows anonymous submissions (rate-limited by IP instead of
    // user id) — captcha verification runs before the file-signature check and rejects
    // the request first since no turnstileToken was supplied.
    expect(response.status()).toBe(400);
    await expect(response.json()).resolves.toEqual({ code: "CAPTCHA_FAILED" });
  });

  test("protect report requires authorization", async ({ request }) => {
    const response = await request.post("/api/protect-reports", {
      headers: {
        Origin: "http://localhost:3000",
      },
      multipart: {
        artistId: "rescene",
        reportType: "defamation",
        title: "Report title",
        content: "Report content",
        platform: "youtube",
        postUrl: "https://youtube.com/watch?v=123",
        postedAt: "2026-01-01",
        authorName: "Anonymous",
        confirmation: "true",
      },
    });

    // Should fail with 401 Unauthorized for unauthenticated user
    expect(response.status()).toBe(401);
    const json = await response.json();
    expect(json.code).toBe("UNAUTHORIZED");
  });
});
