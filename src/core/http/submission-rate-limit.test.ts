// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  createServiceRoleClient: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock("@/core/uploads/service-storage", () => ({
  createServiceRoleClient: mocks.createServiceRoleClient,
}));

import {
  consumeAdminUploadAttemptRateLimit,
  consumeSubmissionAttemptIpRateLimit,
  consumeSubmissionAttemptRateLimit,
  consumeSubmissionUserAttemptRateLimit,
  finalizeSubmissionRateLimit,
  getSubmissionRemaining,
  releaseSubmissionRateLimit,
  reserveSubmissionRateLimit,
} from "./submission-rate-limit";

const request = () =>
  new NextRequest("https://themuze.kr", {
    headers: { "x-vercel-forwarded-for": "203.0.113.4" },
  });

describe("submission rate limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUBMISSION_RATE_LIMIT_SECRET = "test-secret";
    process.env.VERCEL = "1";
    mocks.createServiceRoleClient.mockReturnValue({ rpc: mocks.rpc });
  });

  it("reserves both daily keys in one RPC and returns its reservation", async () => {
    mocks.rpc.mockResolvedValue({
      data: [
        {
          reservation_id: "reservation-1",
          is_allowed: true,
          retry_after_seconds: 0,
          remaining: 4,
        },
      ],
      error: null,
    });

    await expect(
      reserveSubmissionRateLimit(request(), "contact_inquiry", "user-42"),
    ).resolves.toEqual({
      error: false,
      allowed: true,
      remaining: 4,
      retryAfter: 86400,
      reservationId: "reservation-1",
    });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith(
      "reserve_submission_rate_limit",
      expect.objectContaining({
        p_scope: "contact_inquiry",
        p_user_limit: 5,
        p_ip_limit: 500,
        p_window_seconds: 86400,
        p_user_key_hash: expect.any(String),
        p_ip_key_hash: expect.any(String),
      }),
    );
  });

  it("returns the blocking key result without a reservation", async () => {
    mocks.rpc.mockResolvedValue({
      data: [
        {
          reservation_id: null,
          is_allowed: false,
          retry_after_seconds: 120,
          remaining: 0,
        },
      ],
      error: null,
    });

    await expect(
      reserveSubmissionRateLimit(request(), "audition_submission", "user-42"),
    ).resolves.toEqual({
      error: false,
      allowed: false,
      remaining: 0,
      retryAfter: 120,
      reservationId: null,
    });
  });

  it("finalizes and releases by reservation id, including retries", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });

    await expect(finalizeSubmissionRateLimit("reservation-1")).resolves.toEqual(
      { error: false },
    );
    await expect(releaseSubmissionRateLimit("reservation-1")).resolves.toEqual({
      error: false,
    });
    await expect(releaseSubmissionRateLimit("reservation-1")).resolves.toEqual({
      error: false,
    });
    expect(mocks.rpc).toHaveBeenNthCalledWith(
      1,
      "finalize_submission_rate_limit",
      { p_reservation_id: "reservation-1" },
    );
    expect(mocks.rpc).toHaveBeenNthCalledWith(
      2,
      "release_submission_rate_limit",
      { p_reservation_id: "reservation-1" },
    );
    expect(mocks.rpc).toHaveBeenNthCalledWith(
      3,
      "release_submission_rate_limit",
      { p_reservation_id: "reservation-1" },
    );
  });

  it("uses one IP-only RPC for pre-parse abuse protection", async () => {
    mocks.rpc.mockResolvedValue({
      data: [{ is_allowed: true, retry_after_seconds: 0, remaining: 99 }],
      error: null,
    });

    await expect(
      consumeSubmissionAttemptIpRateLimit(request(), "contact_inquiry"),
    ).resolves.toEqual({
      error: false,
      allowed: true,
      remaining: 99,
      retryAfter: 900,
    });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith(
      "consume_submission_rate_limit",
      expect.objectContaining({
        p_scope: "contact_inquiry_attempt",
        p_limit: 100,
        p_window_seconds: 900,
      }),
    );
  });

  it("uses one user-only RPC after validation", async () => {
    mocks.rpc.mockResolvedValue({
      data: [{ is_allowed: true, retry_after_seconds: 0, remaining: 29 }],
      error: null,
    });

    await expect(
      consumeSubmissionUserAttemptRateLimit("protect_report", "user-42"),
    ).resolves.toEqual({
      error: false,
      allowed: true,
      remaining: 29,
      retryAfter: 900,
    });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith(
      "consume_submission_rate_limit",
      expect.objectContaining({
        p_scope: "protect_report_attempt",
        p_limit: 30,
        p_window_seconds: 900,
      }),
    );
  });

  it("keeps the legacy attempt helper user-only", async () => {
    mocks.rpc.mockResolvedValue({
      data: [{ is_allowed: true, remaining: 29 }],
      error: null,
    });
    await consumeSubmissionAttemptRateLimit(
      request(),
      "audition_submission",
      "user-42",
    );
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        p_key_hash: expect.any(String),
        p_scope: "audition_submission_attempt",
      }),
    );
  });

  it("preserves the admin user and IP attempt limits", async () => {
    mocks.rpc.mockResolvedValue({
      data: [{ is_allowed: true, remaining: 29 }],
      error: null,
    });
    await consumeAdminUploadAttemptRateLimit(request(), "admin-1");
    expect(mocks.rpc).toHaveBeenNthCalledWith(
      1,
      "consume_submission_rate_limit",
      expect.objectContaining({
        p_scope: "admin_upload_attempt",
        p_limit: 30,
        p_window_seconds: 3600,
      }),
    );
    expect(mocks.rpc).toHaveBeenNthCalledWith(
      2,
      "consume_submission_rate_limit",
      expect.objectContaining({
        p_scope: "admin_upload_attempt",
        p_limit: 100,
        p_window_seconds: 3600,
      }),
    );
  });

  it("does not consume an unknown IP locally", async () => {
    delete process.env.VERCEL;
    await expect(
      consumeSubmissionAttemptIpRateLimit(
        new NextRequest("http://localhost"),
        "protect_report",
      ),
    ).resolves.toEqual({
      error: false,
      allowed: true,
      remaining: 100,
      retryAfter: 900,
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("fails closed in production without a trusted client IP", async () => {
    delete process.env.VERCEL;
    vi.stubEnv("NODE_ENV", "production");
    await expect(
      reserveSubmissionRateLimit(
        new NextRequest("https://themuze.kr"),
        "protect_report",
        "user-42",
      ),
    ).resolves.toEqual({ error: true });
    vi.unstubAllEnvs();
  });

  it("fails closed when configuration or the RPC fails", async () => {
    delete process.env.SUBMISSION_RATE_LIMIT_SECRET;
    await expect(
      reserveSubmissionRateLimit(request(), "protect_report", "user-42"),
    ).resolves.toEqual({ error: true });

    process.env.SUBMISSION_RATE_LIMIT_SECRET = "test-secret";
    mocks.rpc.mockResolvedValue({
      data: null,
      error: new Error("unavailable"),
    });
    await expect(
      consumeSubmissionUserAttemptRateLimit("protect_report", "user-42"),
    ).resolves.toEqual({ error: true });
  });

  it("reads the user's remaining quota without consuming it", async () => {
    mocks.rpc.mockResolvedValue({ data: [{ remaining: 3 }], error: null });
    await expect(
      getSubmissionRemaining("contact_inquiry", "user-42"),
    ).resolves.toBe(3);
    expect(mocks.rpc).toHaveBeenCalledWith(
      "get_submission_rate_limit_remaining",
      expect.objectContaining({ p_limit: 5 }),
    );
  });
});
