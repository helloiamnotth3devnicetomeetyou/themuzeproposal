// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  createSessionClient: vi.fn(),
  createServiceClient: vi.fn(),
  consumeRateLimit: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  insert: vi.fn(),
}));

vi.mock("@/core/supabase/server", () => ({ createSupabaseServerClient: mocks.createSessionClient }));
vi.mock("@/core/uploads/service-storage", () => ({ createServiceRoleClient: mocks.createServiceClient }));
vi.mock("@/core/http/submission-rate-limit", () => ({ consumeSubmissionRateLimit: mocks.consumeRateLimit }));

import { POST } from "./protect-report-route";

function validRequest() {
  const form = new FormData();
  form.set("artistId", "artist-1");
  form.set("reportType", "defamation");
  form.set("title", "Report title");
  form.set("content", "Report details");
  form.set("platform", "instagram");
  form.set("postUrl", "https://example.com/post");
  form.set("postedAt", "2026-01-01");
  form.set("authorName", "Author");
  form.set("confirmation", "true");
  form.append("evidence", new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], "proof.png", { type: "image/png" }));
  return new NextRequest("http://localhost/api/protect-reports", {
    method: "POST", headers: { origin: "http://localhost" }, body: form,
  });
}

describe("POST /api/protect-reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1", email: "user@example.com" } }, error: null });
    mocks.createSessionClient.mockResolvedValue({ auth: { getUser: mocks.getUser } });
    mocks.consumeRateLimit.mockResolvedValue({ error: false, allowed: true, retryAfter: 0 });
    mocks.upload.mockResolvedValue({ error: null });
    mocks.remove.mockResolvedValue({ error: null });
    mocks.insert.mockResolvedValue({ error: null });
    mocks.createServiceClient.mockReturnValue({
      storage: { from: vi.fn(() => ({ upload: mocks.upload, remove: mocks.remove })) },
      from: vi.fn(() => ({ insert: mocks.insert })),
    });
  });

  it("creates the report and its validated evidence on the server", async () => {
    const response = await POST(validRequest());
    expect(response.status).toBe(200);
    expect(mocks.upload).toHaveBeenCalledWith(expect.stringMatching(/^user-1\/.+\.png$/), expect.any(File), expect.objectContaining({ contentType: "image/png" }));
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: "user-1", confirmation: true }));
  });

  it("does not write a rate-limited report", async () => {
    mocks.consumeRateLimit.mockResolvedValue({ error: false, allowed: false, retryAfter: 75 });
    const response = await POST(validRequest());
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("75");
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
