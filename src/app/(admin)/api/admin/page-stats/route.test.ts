import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const mocks = vi.hoisted(() => ({
  isAdmin: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock("@/core/auth/admin-auth", () => ({ isAdmin: mocks.isAdmin }));
vi.mock("@/core/supabase/server", () => ({
  createSupabaseServerClient: mocks.createClient,
}));

describe("GET /api/admin/page-stats", () => {
  beforeEach(() => {
    vi.stubEnv("VERCEL_TOKEN", "token");
    vi.stubEnv("VERCEL_PROJECT_ID", "prj_test");
    mocks.isAdmin.mockResolvedValue(true);
    mocks.createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin" } } }),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("rejects cross-origin requests before calling Vercel", async () => {
    const response = await GET(
      new Request("https://themuze.kr/api/admin/page-stats", {
        headers: { origin: "https://attacker.example" },
      }),
    );

    expect(response.status).toBe(403);
  });

  it("accepts browser same-origin fetches without an Origin header", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ data: [] })));
    const response = await GET(
      new Request("https://themuze.kr/api/admin/page-stats", {
        headers: { "sec-fetch-site": "same-origin" },
      }),
    );
    expect(response.status).toBe(200);
  });

  it.each(["__proto__", "constructor", "toString"])(
    "rejects inherited range %s",
    async (range) => {
      const response = await GET(
        new Request(`https://themuze.kr/api/admin/page-stats?range=${range}`, {
          headers: { origin: "https://themuze.kr" },
        }),
      );

      expect(response.status).toBe(400);
    },
  );

  it("선택 기간의 추이와 주요 유입 차원을 함께 반환한다", async () => {
    const dataByDimension: Record<string, unknown[]> = {
      week: [
        { timestamp: "2026-08-03T00:00:00.000Z", pageviews: 12, visitors: 8 },
        { timestamp: "2026-08-10T00:00:00.000Z", pageviews: 7, visitors: 5 },
      ],
      requestPath: [
        { requestPath: "/artists/rescene", pageviews: 10, visitors: 7 },
      ],
      country: [{ country: "KR", pageviews: 8, visitors: 5 }],
      deviceType: [{ deviceType: "mobile", pageviews: 7, visitors: 4 }],
      referrerHostname: [
        { referrerHostname: "google.com", pageviews: 6, visitors: 4 },
      ],
    };
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      const by = new URL(url).searchParams.get("by") || "";
      return Promise.resolve(Response.json({ data: dataByDimension[by] }));
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(
      new Request("https://themuze.kr/api/admin/page-stats?range=12w", {
        headers: { origin: "https://themuze.kr" },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      configured: true,
      range: "12w",
      granularity: "week",
      pageviews: 19,
      visitors: 13,
      peakPageviews: 12,
      routes: [{ name: "/artists/rescene", pageviews: 10, visitors: 7 }],
      countries: [{ name: "KR", pageviews: 8, visitors: 5 }],
    });
    expect(fetchMock).toHaveBeenCalledTimes(8);
  });

  it("요금제 조회 기간을 넘으면 구체적인 제한 상태를 반환한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({}, { status: 402 })),
    );

    const response = await GET(
      new Request("https://themuze.kr/api/admin/page-stats?range=12m", {
        headers: { origin: "https://themuze.kr" },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      configured: true,
      range: "12m",
      rangeUnavailable: true,
    });
  });
});
