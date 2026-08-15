// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  classify: vi.fn(),
  createSessionClient: vi.fn(),
  createServiceClient: vi.fn(),
  getUser: vi.fn(),
  isAdmin: vi.fn(),
}));

vi.mock("@/core/ai/classify-inquiry", () => ({ classify: mocks.classify }));
vi.mock("@/core/auth/admin-auth", () => ({ isAdmin: mocks.isAdmin }));
vi.mock("@/core/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSessionClient,
}));
vi.mock("@/core/supabase/service", () => ({
  createServiceRoleClient: mocks.createServiceClient,
}));

import { POST } from "./route";

function builder(result: unknown) {
  const chain: Record<string, unknown> = {};
  for (const method of [
    "select",
    "is",
    "order",
    "limit",
    "update",
    "eq",
    "maybeSingle",
  ])
    chain[method] = vi.fn(() => chain);
  chain.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve(result).then(resolve);
  return chain;
}

describe("POST /api/admin/protect-reports/classify-pending", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "admin-1" } },
      error: null,
    });
    mocks.createSessionClient.mockResolvedValue({
      auth: { getUser: mocks.getUser },
    });
    mocks.isAdmin.mockResolvedValue(true);
    mocks.classify.mockResolvedValue({
      severity: "critical",
      reasoning: "credible immediate risk",
    });
  });

  it("requires same-origin requests", async () => {
    const response = await POST(
      new Request(
        "https://themuze.kr/api/admin/protect-reports/classify-pending",
        {
          method: "POST",
          headers: { origin: "https://attacker.example" },
        },
      ),
    );
    expect(response.status).toBe(403);
    expect(mocks.createSessionClient).not.toHaveBeenCalled();
  });

  it("classifies at most ten pending reports and reports the remainder", async () => {
    const pending = Array.from({ length: 10 }, (_, index) => ({
      id: `report-${index}`,
      report_type: "privacy",
      title: `Report ${index}`,
      content: "Report content",
      platform: "x",
    }));
    const builders = [
      builder({ data: pending, error: null }),
      ...pending.map((report) =>
        builder({ data: { id: report.id }, error: null }),
      ),
      builder({ count: 2, error: null }),
    ];
    const from = vi.fn(() => builders.shift());
    mocks.createServiceClient.mockReturnValue({ from });

    const response = await POST(
      new Request(
        "https://themuze.kr/api/admin/protect-reports/classify-pending",
        {
          method: "POST",
          headers: { origin: "https://themuze.kr" },
        },
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      processed: 10,
      remaining: 2,
    });
    expect(mocks.classify).toHaveBeenCalledTimes(10);
    expect(from).toHaveBeenCalledTimes(12);
  });
});
