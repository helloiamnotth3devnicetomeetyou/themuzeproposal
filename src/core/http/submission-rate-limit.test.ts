// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ createServiceRoleClient: vi.fn(), rpc: vi.fn() }));

vi.mock("@/core/uploads/service-storage", () => ({
  createServiceRoleClient: mocks.createServiceRoleClient,
}));

import { consumeSubmissionRateLimit } from "./submission-rate-limit";

describe("consumeSubmissionRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUBMISSION_RATE_LIMIT_SECRET = "test-secret";
    mocks.createServiceRoleClient.mockReturnValue({ rpc: mocks.rpc });
  });

  it("uses the first forwarded client IP and configured scope", async () => {
    mocks.rpc.mockResolvedValue({ data: [{ is_allowed: true, retry_after_seconds: 12 }], error: null });
    const request = new NextRequest("https://themuze.kr/api/contact-inquiries", {
      headers: { "x-forwarded-for": "203.0.113.4, 10.0.0.1" },
    });

    await expect(consumeSubmissionRateLimit(request, "contact_inquiry"))
      .resolves.toEqual({ error: false, allowed: true, retryAfter: 12 });
    expect(mocks.rpc).toHaveBeenCalledWith("consume_submission_rate_limit", expect.objectContaining({
      p_scope: "contact_inquiry", p_limit: 5, p_window_seconds: 900,
      p_key_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    }));
  });

  it("fails closed when configuration or the RPC fails", async () => {
    delete process.env.SUBMISSION_RATE_LIMIT_SECRET;
    await expect(consumeSubmissionRateLimit(new NextRequest("https://themuze.kr"), "protect_report"))
      .resolves.toEqual({ error: true });

    process.env.SUBMISSION_RATE_LIMIT_SECRET = "test-secret";
    mocks.rpc.mockResolvedValue({ data: null, error: new Error("unavailable") });
    await expect(consumeSubmissionRateLimit(new NextRequest("https://themuze.kr"), "protect_report"))
      .resolves.toEqual({ error: true });
  });
});
