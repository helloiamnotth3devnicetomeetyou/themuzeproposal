// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  insert: vi.fn(),
  createSessionClient: vi.fn(),
  createServiceClient: vi.fn(),
  reserveRateLimit: vi.fn(),
  finalizeRateLimit: vi.fn(),
  releaseRateLimit: vi.fn(),
  consumeIpAttemptRateLimit: vi.fn(),
  consumeUserAttemptRateLimit: vi.fn(),
  verifyTurnstileToken: vi.fn(),
  classify: vi.fn(),
}));

vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: (callback: () => unknown) => void callback(),
}));

vi.mock("@/core/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSessionClient,
}));
vi.mock("@/core/storage/r2", () => ({
  uploadObject: (options: {
    bucket: string;
    path: string;
    body: unknown;
    contentType: string;
    cacheControl?: string;
  }) =>
    mocks.upload(options.path, options.body, {
      contentType: options.contentType,
      cacheControl: options.cacheControl,
      upsert: false,
    }),
  deleteObjects: (_bucket: string, paths: string[]) => mocks.remove(paths),
}));
vi.mock("@/core/uploads/service-storage", () => ({
  createServiceRoleClient: mocks.createServiceClient,
}));
vi.mock("@/core/http/submission-rate-limit", () => ({
  reserveSubmissionRateLimit: mocks.reserveRateLimit,
  finalizeSubmissionRateLimit: mocks.finalizeRateLimit,
  releaseSubmissionRateLimit: mocks.releaseRateLimit,
  consumeSubmissionIpAttemptRateLimit: mocks.consumeIpAttemptRateLimit,
  consumeSubmissionUserAttemptRateLimit: mocks.consumeUserAttemptRateLimit,
}));
vi.mock("@/core/http/turnstile", () => ({
  verifyTurnstileToken: mocks.verifyTurnstileToken,
}));
vi.mock("@/core/ai/classify-inquiry", () => ({
  classify: mocks.classify,
}));

import { POST } from "./contact-inquiry-route";

function validForm(attachment?: File) {
  const formData = new FormData();
  formData.set("category", "business");
  formData.set("inquiryType", "brand_collaboration");
  formData.set("companyName", "Company");
  formData.set("contactName", "Contact");
  formData.set("phone", "010-0000-0000");
  formData.set("email", "contact@example.com");
  formData.set("message", "Partnership proposal");
  formData.set("privacyConsent", "true");
  formData.set("turnstileToken", "test-turnstile-token");
  if (attachment) formData.set("attachment", attachment);
  return formData;
}

function request(body: BodyInit) {
  return new NextRequest("http://localhost/api/contact-inquiries", {
    method: "POST",
    headers: { origin: "http://localhost" },
    body,
  });
}

describe("POST /api/contact-inquiries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "contact@example.com" } },
      error: null,
    });
    mocks.createSessionClient.mockResolvedValue({
      auth: { getUser: mocks.getUser },
    });
    mocks.upload.mockResolvedValue({ error: false });
    mocks.remove.mockResolvedValue({ error: false });
    mocks.insert.mockResolvedValue({ error: null });
    mocks.reserveRateLimit.mockResolvedValue({
      error: false,
      allowed: true,
      remaining: 4,
      retryAfter: 0,
      reservationId: "reservation-1",
    });
    mocks.finalizeRateLimit.mockResolvedValue({ error: false });
    mocks.releaseRateLimit.mockResolvedValue({ error: false });
    mocks.consumeIpAttemptRateLimit.mockResolvedValue({
      error: false,
      allowed: true,
      retryAfter: 0,
    });
    mocks.consumeUserAttemptRateLimit.mockResolvedValue({
      error: false,
      allowed: true,
      remaining: 29,
      retryAfter: 0,
    });
    mocks.verifyTurnstileToken.mockResolvedValue(true);
    mocks.classify.mockResolvedValue(null);
    mocks.createServiceClient.mockReturnValue({
      from: vi.fn(() => ({ insert: mocks.insert })),
    });
  });

  it("stores the received byte length and canonical MIME type", async () => {
    const file = new File(
      [
        "%PDF-1.7\n1 0 obj\n<<>>\nendobj\nxref\n0 2\n0000000000 65535 f \n0000000009 00000 n \ntrailer\n<< /Size 2 >>\nstartxref\n33\n%%EOF\n",
      ],
      "proposal.pdf",
      {
        type: "text/html",
      },
    );
    const response = await POST(request(validForm(file)));

    expect(response.status).toBe(200);
    expect(mocks.upload).toHaveBeenCalledWith(
      expect.stringMatching(/\.pdf$/),
      file,
      expect.objectContaining({ contentType: "application/pdf" }),
    );
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        attachment_name: "proposal.pdf",
        attachment_size: file.size,
      }),
    );
  });

  it("bounds the persisted attachment filename", async () => {
    const file = new File(
      [
        "%PDF-1.7\n1 0 obj\n<<>>\nendobj\nxref\n0 2\n0000000000 65535 f \n0000000009 00000 n \ntrailer\n<< /Size 2 >>\nstartxref\n33\n%%EOF\n",
      ],
      `${"a".repeat(300)}.pdf`,
      { type: "application/pdf" },
    );
    const response = await POST(request(validForm(file)));

    expect(response.status).toBe(200);
    expect(mocks.insert.mock.calls[0][0].attachment_name).toHaveLength(255);
  });

  it("rejects a declared PDF whose bytes are HTML", async () => {
    const file = new File(["<script>alert(1)</script>"], "proposal.pdf", {
      type: "application/pdf",
    });
    const response = await POST(request(validForm(file)));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      code: "INVALID_FILE_TYPE",
    });
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rejects an overlong phone number for general inquiries", async () => {
    const form = validForm();
    form.set("category", "general");
    form.set("inquiryType", "account");
    form.set("phone", "1".repeat(41));
    const response = await POST(request(form));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ code: "INVALID_REQUEST" });
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("stops rate-limited submissions before uploading or inserting", async () => {
    mocks.reserveRateLimit.mockResolvedValue({
      error: false,
      allowed: false,
      remaining: 0,
      retryAfter: 90,
      reservationId: null,
    });
    const nextRequest = request(validForm());
    const response = await POST(nextRequest);

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("90");
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rejects exhausted attempt budgets before validating captcha", async () => {
    mocks.consumeIpAttemptRateLimit.mockResolvedValueOnce({
      error: false,
      allowed: false,
      retryAfter: 30,
    });
    const response = await POST(
      request(new URLSearchParams({ turnstileToken: "test-turnstile-token" })),
    );
    expect(response.status).toBe(429);
    expect(mocks.createSessionClient).not.toHaveBeenCalled();
    expect(mocks.verifyTurnstileToken).not.toHaveBeenCalled();
    expect(mocks.reserveRateLimit).not.toHaveBeenCalled();
  });

  it("rejects a failed captcha before consuming the daily rate limit", async () => {
    mocks.verifyTurnstileToken.mockResolvedValueOnce(false);
    const response = await POST(request(validForm()));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ code: "CAPTCHA_FAILED" });
    expect(mocks.createSessionClient).not.toHaveBeenCalled();
    expect(mocks.reserveRateLimit).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("releases a reserved quota when the attachment upload fails", async () => {
    mocks.upload.mockResolvedValueOnce({ error: new Error("upload failed") });

    const response = await POST(
      request(
        validForm(
          new File(
            [
              "%PDF-1.7\n1 0 obj\n<<>>\nendobj\nxref\n0 2\n0000000000 65535 f \n0000000009 00000 n \ntrailer\n<< /Size 2 >>\nstartxref\n33\n%%EOF\n",
            ],
            "proposal.pdf",
            { type: "application/pdf" },
          ),
        ),
      ),
    );

    expect(response.status).toBe(503);
    expect(mocks.releaseRateLimit).toHaveBeenCalledWith("reservation-1");
    expect(mocks.finalizeRateLimit).not.toHaveBeenCalled();
  });

  it("releases a reserved quota when the inquiry insert fails", async () => {
    mocks.insert.mockResolvedValueOnce({ error: new Error("insert failed") });

    const response = await POST(request(validForm()));

    expect(response.status).toBe(503);
    expect(mocks.releaseRateLimit).toHaveBeenCalledWith("reservation-1");
    expect(mocks.finalizeRateLimit).not.toHaveBeenCalled();
  });

  it("charges the IP attempt budget once and the user attempt budget once", async () => {
    const response = await POST(request(validForm()));

    expect(response.status).toBe(200);
    expect(mocks.consumeIpAttemptRateLimit).toHaveBeenCalledOnce();
    expect(mocks.consumeUserAttemptRateLimit).toHaveBeenCalledWith(
      "contact_inquiry",
      "user-1",
    );
    expect(mocks.finalizeRateLimit).toHaveBeenCalledWith("reservation-1");
  });
});
