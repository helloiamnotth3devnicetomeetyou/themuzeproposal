// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  createSessionClient: vi.fn(),
  createServiceClient: vi.fn(),
  reserveRateLimit: vi.fn(),
  finalizeRateLimit: vi.fn(),
  releaseRateLimit: vi.fn(),
  consumeIpAttemptRateLimit: vi.fn(),
  consumeUserAttemptRateLimit: vi.fn(),
  artistSelect: vi.fn(),
  artistIdEq: vi.fn(),
  artistActiveEq: vi.fn(),
  artistMaybeSingle: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  insert: vi.fn(),
  reportDelete: vi.fn(),
  reportDeleteEq: vi.fn(),
  verifyTurnstileToken: vi.fn(),
  classify: vi.fn(),
  update: vi.fn(),
  updateEq: vi.fn(),
  updateIs: vi.fn(),
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

import { POST } from "./protect-report-route";

function validRequest(
  postUrl = "https://example.com/post",
  fileName = "proof.png",
  postedAt = "2026-01-01",
) {
  const form = new FormData();
  form.set("artistId", "00000000-0000-4000-8000-000000000001");
  form.set("reportType", "defamation");
  form.set("title", "Report title");
  form.set("content", "Report details");
  form.set("platform", "instagram");
  form.set("postUrl", postUrl);
  form.set("postedAt", postedAt);
  form.set("authorName", "Author");
  form.set("confirmation", "true");
  form.set("turnstileToken", "test-turnstile-token");
  form.append(
    "evidence",
    new File(
      [
        Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          "base64",
        ),
      ],
      fileName,
      { type: "image/png" },
    ),
  );
  return new NextRequest("http://localhost/api/protect-reports", {
    method: "POST",
    headers: { origin: "http://localhost" },
    body: form,
  });
}

describe("POST /api/protect-reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "user@example.com" } },
      error: null,
    });
    mocks.createSessionClient.mockResolvedValue({
      auth: { getUser: mocks.getUser },
    });
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
    mocks.artistSelect.mockReturnValue({ eq: mocks.artistIdEq });
    mocks.artistIdEq.mockReturnValue({ eq: mocks.artistActiveEq });
    mocks.artistActiveEq.mockReturnValue({
      maybeSingle: mocks.artistMaybeSingle,
    });
    mocks.artistMaybeSingle.mockResolvedValue({
      data: { id: "00000000-0000-4000-8000-000000000001" },
      error: null,
    });
    mocks.verifyTurnstileToken.mockResolvedValue(true);
    mocks.classify.mockResolvedValue(null);
    mocks.update.mockReturnValue({ eq: mocks.updateEq });
    mocks.updateEq.mockReturnValue({
      is: mocks.updateIs,
    });
    mocks.updateIs.mockResolvedValue({ error: null });
    mocks.upload.mockResolvedValue({ error: false });
    mocks.remove.mockResolvedValue({ error: false });
    mocks.insert.mockResolvedValue({ error: null });
    mocks.reportDelete.mockReturnValue({ eq: mocks.reportDeleteEq });
    mocks.reportDeleteEq.mockResolvedValue({ error: null });
    mocks.createServiceClient.mockReturnValue({
      from: vi.fn((table: string) =>
        table === "artists"
          ? { select: mocks.artistSelect }
          : {
              insert: mocks.insert,
              update: mocks.update,
              delete: mocks.reportDelete,
            },
      ),
    });
  });

  it("creates the report and its validated evidence on the server", async () => {
    const response = await POST(validRequest());
    expect(response.status).toBe(200);
    expect(mocks.reserveRateLimit).toHaveBeenCalledWith(
      expect.anything(),
      "protect_report",
      "user-1",
    );
    expect(mocks.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^user-1\/.+\.png$/),
      expect.any(File),
      expect.objectContaining({ contentType: "image/png" }),
    );
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-1", confirmation: true }),
    );
    expect(mocks.artistIdEq).toHaveBeenCalledWith(
      "id",
      "00000000-0000-4000-8000-000000000001",
    );
    expect(mocks.artistActiveEq).toHaveBeenCalledWith("is_active", true);
  });

  it("schedules protect classification after a successful insert", async () => {
    mocks.classify.mockResolvedValue({
      severity: "high",
      reasoning: "credible harm",
    });

    const response = await POST(validRequest());
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(response.status).toBe(200);
    expect(mocks.classify).toHaveBeenCalledWith(
      expect.objectContaining({
        domain: "protect",
        type: "defamation",
        text: "Report title\n\nReport details",
      }),
    );
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: "high",
        ai_reasoning: "credible harm",
        ai_classified_at: expect.any(String),
      }),
    );
  });

  it("rejects an invalid artist ID before looking up or consuming quota", async () => {
    const formRequest = validRequest();
    const form = await formRequest.formData();
    form.set("artistId", "not-a-uuid");
    const request = new NextRequest("http://localhost/api/protect-reports", {
      method: "POST",
      headers: { origin: "http://localhost" },
      body: form,
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(mocks.artistSelect).not.toHaveBeenCalled();
    expect(mocks.reserveRateLimit).not.toHaveBeenCalled();
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("rejects missing or inactive artists before consuming quota or uploading", async () => {
    mocks.artistMaybeSingle.mockResolvedValue({ data: null, error: null });

    const response = await POST(validRequest());

    expect(response.status).toBe(400);
    expect(mocks.artistActiveEq).toHaveBeenCalledWith("is_active", true);
    expect(mocks.reserveRateLimit).not.toHaveBeenCalled();
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("rejects an oversized post URL", async () => {
    const response = await POST(
      validRequest(`https://example.com/${"a".repeat(2048)}`),
    );

    expect(response.status).toBe(400);
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("rejects an impossible calendar date", async () => {
    const response = await POST(
      validRequest("https://example.com/post", "proof.png", "2026-02-31"),
    );

    expect(response.status).toBe(400);
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("bounds persisted evidence filenames", async () => {
    const response = await POST(
      validRequest("https://example.com/post", `${"a".repeat(300)}.png`),
    );

    expect(response.status).toBe(200);
    const attachmentInsert = mocks.insert.mock.calls[1][0] as Array<{
      file_name: string;
    }>;
    expect(attachmentInsert[0].file_name).toHaveLength(255);
  });

  it("stops a rate-limited report before writing", async () => {
    mocks.reserveRateLimit.mockResolvedValue({
      error: false,
      allowed: false,
      remaining: 0,
      retryAfter: 75,
      reservationId: null,
    });
    const nextRequest = validRequest();
    const response = await POST(nextRequest);
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("75");
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rejects a failed captcha before consuming the daily rate limit", async () => {
    mocks.verifyTurnstileToken.mockResolvedValueOnce(false);
    const response = await POST(validRequest());
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ code: "CAPTCHA_FAILED" });
    expect(mocks.reserveRateLimit).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("releases a reserved quota when evidence upload fails", async () => {
    mocks.upload.mockResolvedValueOnce({ error: new Error("upload failed") });

    const response = await POST(validRequest());

    expect(response.status).toBe(503);
    expect(mocks.remove).toHaveBeenCalledWith([
      expect.stringMatching(/^user-1\/.+\.png$/),
    ]);
    expect(mocks.releaseRateLimit).toHaveBeenCalledWith("reservation-1");
    expect(mocks.finalizeRateLimit).not.toHaveBeenCalled();
  });

  it("releases a reserved quota when report persistence fails", async () => {
    mocks.insert.mockResolvedValueOnce({ error: new Error("insert failed") });

    const response = await POST(validRequest());

    expect(response.status).toBe(503);
    expect(mocks.remove).toHaveBeenCalledWith([
      expect.stringMatching(/^user-1\/.+\.png$/),
    ]);
    expect(mocks.releaseRateLimit).toHaveBeenCalledWith("reservation-1");
    expect(mocks.finalizeRateLimit).not.toHaveBeenCalled();
  });

  it("rolls back the report row when attachment metadata persistence fails", async () => {
    mocks.insert
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: new Error("attachment insert failed") });
    mocks.remove.mockResolvedValueOnce({ error: true });

    const response = await POST(validRequest());

    expect(response.status).toBe(503);
    expect(mocks.remove).toHaveBeenCalledWith([
      expect.stringMatching(/^user-1\/.+\.png$/),
    ]);
    expect(mocks.reportDelete).toHaveBeenCalledOnce();
    expect(mocks.reportDeleteEq).toHaveBeenCalledWith(
      "id",
      expect.stringMatching(/^[0-9a-f-]{36}$/),
    );
    expect(mocks.releaseRateLimit).toHaveBeenCalledWith("reservation-1");
    expect(mocks.finalizeRateLimit).not.toHaveBeenCalled();
  });

  it("uses one IP and one user attempt limiter for a valid report", async () => {
    const response = await POST(validRequest());

    expect(response.status).toBe(200);
    expect(mocks.consumeIpAttemptRateLimit).toHaveBeenCalledOnce();
    expect(mocks.consumeUserAttemptRateLimit).toHaveBeenCalledWith(
      "protect_report",
      "user-1",
    );
    expect(mocks.finalizeRateLimit).toHaveBeenCalledWith("reservation-1");
  });
});
