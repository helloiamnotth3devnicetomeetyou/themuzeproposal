// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  listCandidates: vi.fn(),
  purgeCandidates: vi.fn(),
}));

vi.mock("@/core/supabase/service", () => ({
  createServiceRoleClient: mocks.createServiceClient,
}));
vi.mock("@/admin/api/retention-route", () => ({
  listRetentionCandidates: mocks.listCandidates,
  purgeRetentionCandidates: mocks.purgeCandidates,
}));

import { GET } from "./retention-cron-route";

const id = "123e4567-e89b-12d3-a456-426614174000";
const url = "https://themuze.kr/api/admin/retention/cron";

describe("retention cron route", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-test-secret";
    mocks.createServiceClient.mockReturnValue({});
    mocks.listCandidates.mockResolvedValue({
      error: false,
      candidates: [
        {
          kind: "contact_inquiry",
          id,
          created_at: "2026-07-01T00:00:00.000Z",
          expires_at: "2026-07-31T00:00:00.000Z",
          attachment_count: 0,
          retryable: false,
        },
      ],
    });
    mocks.purgeCandidates.mockResolvedValue([
      { item: { kind: "contact_inquiry", id }, deleted: true },
    ]);
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalSecret;
  });

  it("requires the exact Vercel Bearer secret", async () => {
    const response = await GET(new NextRequest(url));

    expect(response.status).toBe(401);
    expect(mocks.createServiceClient).not.toHaveBeenCalled();
  });

  it("runs a bounded purge as the system actor", async () => {
    const response = await GET(
      new NextRequest(url, {
        headers: { authorization: "Bearer cron-test-secret" },
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.listCandidates).toHaveBeenCalledWith({}, 25);
    expect(mocks.purgeCandidates).toHaveBeenCalledWith(
      {},
      [{ kind: "contact_inquiry", id }],
      null,
    );
    await expect(response.json()).resolves.toEqual({
      processed: 1,
      deleted: 1,
      failed: [],
    });
  });

  it("returns a retryable failure without hiding the batch result", async () => {
    mocks.purgeCandidates.mockResolvedValueOnce([
      {
        item: { kind: "contact_inquiry", id },
        code: "RETRY_REQUIRED",
        deleted: false,
      },
    ]);

    const response = await GET(
      new NextRequest(url, {
        headers: { authorization: "Bearer cron-test-secret" },
      }),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      processed: 1,
      deleted: 0,
      failed: [{ kind: "contact_inquiry", id, code: "RETRY_REQUIRED" }],
    });
  });
});
