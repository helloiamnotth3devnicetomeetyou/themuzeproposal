// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  createSessionClient: vi.fn(),
  createServiceClient: vi.fn(),
  consumeRateLimit: vi.fn(),
  consumeAttemptRateLimit: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  insert: vi.fn(),
  verifyTurnstileToken: vi.fn(),
}));

vi.mock("@/core/supabase/server", () => ({ createSupabaseServerClient: mocks.createSessionClient }));
vi.mock("@/core/storage/r2", () => ({
  uploadObject: (options: { bucket: string; path: string; body: unknown; contentType: string; cacheControl?: string }) =>
    mocks.upload(options.path, options.body, { contentType: options.contentType, cacheControl: options.cacheControl, upsert: false }),
  deleteObjects: (_bucket: string, paths: string[]) => mocks.remove(paths),
}));
vi.mock("@/core/uploads/service-storage", () => ({ createServiceRoleClient: mocks.createServiceClient }));
vi.mock("@/core/http/submission-rate-limit", () => ({ consumeSubmissionRateLimit: mocks.consumeRateLimit, consumeSubmissionAttemptRateLimit: mocks.consumeAttemptRateLimit }));
vi.mock("@/core/http/turnstile", () => ({ verifyTurnstileToken: mocks.verifyTurnstileToken }));

import { POST } from "./protect-report-route";

function validRequest(postUrl = "https://example.com/post", fileName = "proof.png") {
  const form = new FormData();
  form.set("artistId", "artist-1");
  form.set("reportType", "defamation");
  form.set("title", "Report title");
  form.set("content", "Report details");
  form.set("platform", "instagram");
  form.set("postUrl", postUrl);
  form.set("postedAt", "2026-01-01");
  form.set("authorName", "Author");
  form.set("confirmation", "true");
  form.set("turnstileToken", "test-turnstile-token");
  form.append("evidence", new File([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64")], fileName, { type: "image/png" }));
  return new NextRequest("http://localhost/api/protect-reports", {
    method: "POST", headers: { origin: "http://localhost" }, body: form,
  });
}

describe("POST /api/protect-reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1", email: "user@example.com" } }, error: null });
    mocks.createSessionClient.mockResolvedValue({ auth: { getUser: mocks.getUser } });
    mocks.consumeRateLimit.mockResolvedValue({ error: false, allowed: true, remaining: 4, retryAfter: 0 });
    mocks.consumeAttemptRateLimit.mockResolvedValue({ error: false, allowed: true, remaining: 29, retryAfter: 0 });
    mocks.verifyTurnstileToken.mockResolvedValue(true);
    mocks.upload.mockResolvedValue({ error: false });
    mocks.remove.mockResolvedValue({ error: false });
    mocks.insert.mockResolvedValue({ error: null });
    mocks.createServiceClient.mockReturnValue({
      from: vi.fn(() => ({ insert: mocks.insert })),
    });
  });

  it("creates the report and its validated evidence on the server", async () => {
    const response = await POST(validRequest());
    expect(response.status).toBe(200);
    expect(mocks.consumeRateLimit).toHaveBeenCalledWith(expect.anything(), "protect_report", "user-1");
    expect(mocks.upload).toHaveBeenCalledWith(expect.stringMatching(/^user-1\/.+\.png$/), expect.any(File), expect.objectContaining({ contentType: "image/png" }));
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: "user-1", confirmation: true }));
  });

  it("rejects an oversized post URL", async () => {
    const response = await POST(validRequest(`https://example.com/${"a".repeat(2048)}`));

    expect(response.status).toBe(400);
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("bounds persisted evidence filenames", async () => {
    const response = await POST(validRequest("https://example.com/post", `${"a".repeat(300)}.png`));

    expect(response.status).toBe(200);
    const attachmentInsert = mocks.insert.mock.calls[1][0] as Array<{ file_name: string }>;
    expect(attachmentInsert[0].file_name).toHaveLength(255);
  });

  it("stops a rate-limited report before writing", async () => {
    mocks.consumeRateLimit.mockResolvedValue({ error: false, allowed: false, remaining: 0, retryAfter: 75 });
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
    expect(mocks.consumeRateLimit).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
