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

  it("uses the rightmost forwarded client IP and configured scope", async () => {
    mocks.rpc.mockResolvedValue({ data: [{ is_allowed: true, retry_after_seconds: 12 }], error: null });
    const request = new NextRequest("https://themuze.kr/api/contact-inquiries", {
      headers: { "x-forwarded-for": "203.0.113.4, 10.0.0.1" },
    });

    await expect(consumeSubmissionRateLimit(request, "contact_inquiry"))
      .resolves.toEqual({ error: false, allowed: true, retryAfter: 900 });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith("consume_submission_rate_limit", expect.objectContaining({
      p_scope: "contact_inquiry", p_limit: 5, p_window_seconds: 900,
      p_key_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    }));
  });

  it("consumes both IP and userId keys when userId is provided", async () => {
    mocks.rpc.mockResolvedValue({ data: [{ is_allowed: true, retry_after_seconds: 10 }], error: null });
    const request = new NextRequest("https://themuze.kr/api/audition/submit", {
      headers: { "x-forwarded-for": "203.0.113.4" },
    });

    await expect(consumeSubmissionRateLimit(request, "audition_submission", "user-42"))
      .resolves.toEqual({ error: false, allowed: true, retryAfter: 86400 });
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
  });

  it("blocks when the userId key is exhausted even if IP key is allowed", async () => {
    mocks.rpc
      .mockResolvedValueOnce({ data: [{ is_allowed: true, retry_after_seconds: 0 }], error: null })
      .mockResolvedValueOnce({ data: [{ is_allowed: false, retry_after_seconds: 300 }], error: null });
    const request = new NextRequest("https://themuze.kr/api/protect-reports", {
      headers: { "x-forwarded-for": "203.0.113.4" },
    });

    await expect(consumeSubmissionRateLimit(request, "protect_report", "user-42"))
      .resolves.toEqual({ error: false, allowed: false, retryAfter: 300 });
  });

  it("blocks when the IP key is exhausted even if userId key is allowed", async () => {
    mocks.rpc
      .mockResolvedValueOnce({ data: [{ is_allowed: false, retry_after_seconds: 120 }], error: null })
      .mockResolvedValueOnce({ data: [{ is_allowed: true, retry_after_seconds: 0 }], error: null });
    const request = new NextRequest("https://themuze.kr/api/audition/submit", {
      headers: { "x-forwarded-for": "203.0.113.4" },
    });

    await expect(consumeSubmissionRateLimit(request, "audition_submission", "user-42"))
      .resolves.toEqual({ error: false, allowed: false, retryAfter: 120 });
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

  it("fails closed when any one RPC in a dual call errors", async () => {
    mocks.rpc
      .mockResolvedValueOnce({ data: [{ is_allowed: true, retry_after_seconds: 0 }], error: null })
      .mockResolvedValueOnce({ data: null, error: new Error("unavailable") });

    await expect(consumeSubmissionRateLimit(new NextRequest("https://themuze.kr"), "audition_submission", "user-42"))
      .resolves.toEqual({ error: true });
  });
});
