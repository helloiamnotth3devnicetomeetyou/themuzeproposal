// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ createServiceRoleClient: vi.fn(), rpc: vi.fn() }));
vi.mock("@/core/uploads/service-storage", () => ({ createServiceRoleClient: mocks.createServiceRoleClient }));

import { consumeSubmissionAttemptRateLimit, consumeSubmissionRateLimit, getSubmissionRemaining } from "./submission-rate-limit";

describe("submission rate limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUBMISSION_RATE_LIMIT_SECRET = "test-secret";
    process.env.VERCEL = "1";
    mocks.createServiceRoleClient.mockReturnValue({ rpc: mocks.rpc });
  });

  it("uses a daily user quota and only a high IP safety limit", async () => {
    mocks.rpc.mockResolvedValue({ data: [{ is_allowed: true, retry_after_seconds: 0, remaining: 4 }], error: null });
    const request = new NextRequest("https://themuze.kr/api/contact-inquiries", {
      headers: { "x-vercel-forwarded-for": "203.0.113.4" },
    });

    await expect(consumeSubmissionRateLimit(request, "contact_inquiry", "user-42"))
      .resolves.toEqual({ error: false, allowed: true, remaining: 4, retryAfter: 86400 });
    expect(mocks.rpc).toHaveBeenNthCalledWith(1, "consume_submission_rate_limit", expect.objectContaining({
      p_scope: "contact_inquiry", p_limit: 5, p_window_seconds: 86400,
    }));
    expect(mocks.rpc).toHaveBeenNthCalledWith(2, "consume_submission_rate_limit", expect.objectContaining({
      p_scope: "contact_inquiry", p_limit: 500, p_window_seconds: 86400,
    }));
  });

  it("works from local development without a trusted client IP", async () => {
    delete process.env.VERCEL;
    mocks.rpc.mockResolvedValue({ data: [{ is_allowed: true, remaining: 3 }], error: null });

    await expect(consumeSubmissionRateLimit(new NextRequest("http://localhost"), "protect_report", "user-42"))
      .resolves.toEqual({ error: false, allowed: true, remaining: 3, retryAfter: 86400 });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });

  it("blocks when either the user quota or IP safety limit is exhausted", async () => {
    mocks.rpc
      .mockResolvedValueOnce({ data: [{ is_allowed: true, remaining: 2 }], error: null })
      .mockResolvedValueOnce({ data: [{ is_allowed: false, retry_after_seconds: 120, remaining: 0 }], error: null });
    const request = new NextRequest("https://themuze.kr", { headers: { "x-vercel-forwarded-for": "203.0.113.4" } });

    await expect(consumeSubmissionRateLimit(request, "audition_submission", "user-42"))
      .resolves.toEqual({ error: false, allowed: false, remaining: 2, retryAfter: 120 });
  });

  it("uses a separate short request-attempt budget", async () => {
    mocks.rpc.mockResolvedValue({ data: [{ is_allowed: true, remaining: 29 }], error: null });
    const request = new NextRequest("https://themuze.kr", { headers: { "x-vercel-forwarded-for": "203.0.113.4" } });
    await consumeSubmissionAttemptRateLimit(request, "protect_report", "user-42");
    expect(mocks.rpc).toHaveBeenNthCalledWith(1, "consume_submission_rate_limit", expect.objectContaining({
      p_scope: "protect_report_attempt", p_limit: 30, p_window_seconds: 900,
    }));
  });

  it("fails closed in production without a trusted client IP", async () => {
    delete process.env.VERCEL;
    vi.stubEnv("NODE_ENV", "production");
    await expect(consumeSubmissionRateLimit(new NextRequest("https://themuze.kr"), "protect_report", "user-42"))
      .resolves.toEqual({ error: true });
    vi.unstubAllEnvs();
  });

  it("fails closed when configuration or the RPC fails", async () => {
    delete process.env.SUBMISSION_RATE_LIMIT_SECRET;
    await expect(consumeSubmissionRateLimit(new NextRequest("https://themuze.kr"), "protect_report", "user-42"))
      .resolves.toEqual({ error: true });

    process.env.SUBMISSION_RATE_LIMIT_SECRET = "test-secret";
    mocks.rpc.mockResolvedValue({ data: null, error: new Error("unavailable") });
    await expect(consumeSubmissionRateLimit(new NextRequest("https://themuze.kr"), "protect_report", "user-42"))
      .resolves.toEqual({ error: true });
  });

  it("reads the user's remaining quota without consuming it", async () => {
    mocks.rpc.mockResolvedValue({ data: [{ remaining: 3 }], error: null });
    await expect(getSubmissionRemaining("contact_inquiry", "user-42")).resolves.toBe(3);
    expect(mocks.rpc).toHaveBeenCalledWith("get_submission_rate_limit_remaining", expect.objectContaining({ p_limit: 5 }));
  });
});
