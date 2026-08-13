import { isAdmin } from "@/core/auth/admin-auth";
import { isSameOriginRequest } from "@/core/http/same-origin";
import { createSupabaseServerClient } from "@/core/supabase/server";

type Range = "7d" | "30d" | "12w" | "12m";
type Granularity = "day" | "week" | "month";
type VercelVisit = { timestamp: string; pageviews: number; visitors: number };
type Breakdown = { name: string; pageviews: number; visitors: number };
class VercelApiError extends Error {
  constructor(readonly status: number) {
    super(`Vercel Web Analytics API returned ${status}`);
  }
}

const ranges: Record<Range, { days: number; granularity: Granularity }> = {
  "7d": { days: 7, granularity: "day" },
  "30d": { days: 30, granularity: "day" },
  "12w": { days: 84, granularity: "week" },
  "12m": { days: 365, granularity: "month" },
};
const seoulDateKey = (date: Date) =>
  new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

const emptyStats = (configured: boolean, range: Range) => ({
  configured,
  range,
  granularity: ranges[range].granularity,
  pageviews: 0,
  visitors: 0,
  peakPageviews: 0,
  points: [] as VercelVisit[],
  routes: [] as Breakdown[],
  countries: [] as Breakdown[],
  devices: [] as Breakdown[],
  operatingSystems: [] as Breakdown[],
  browsers: [] as Breakdown[],
  environments: [] as Breakdown[],
  referrers: [] as Breakdown[],
});

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "private, no-store");
  return Response.json(body, { ...init, headers });
}

const readRows = async (response: Response) => {
  if (!response.ok) throw new VercelApiError(response.status);
  const payload = (await response.json()) as { data?: unknown };
  if (!Array.isArray(payload.data))
    throw new Error("Invalid Vercel Web Analytics response");
  return payload.data;
};

const parseTrend = (rows: unknown[]) =>
  rows.flatMap((row): VercelVisit[] => {
    if (!row || typeof row !== "object") return [];
    const { timestamp, pageviews, visitors } = row as Record<string, unknown>;
    if (
      typeof timestamp !== "string" ||
      typeof pageviews !== "number" ||
      typeof visitors !== "number"
    )
      return [];
    return [{ timestamp, pageviews, visitors }];
  });

const parseBreakdown = (rows: unknown[], dimension: string) =>
  rows
    .flatMap((row): Breakdown[] => {
      if (!row || typeof row !== "object") return [];
      const record = row as Record<string, unknown>;
      if (
        typeof record[dimension] !== "string" ||
        typeof record.pageviews !== "number" ||
        typeof record.visitors !== "number"
      )
        return [];
      return [
        {
          name: record[dimension],
          pageviews: record.pageviews,
          visitors: record.visitors,
        },
      ];
    })
    .sort((a, b) => b.pageviews - a.pageviews);

export async function GET(request: Request) {
  if (!isSameOriginRequest(request))
    return jsonNoStore({ error: "forbidden" }, { status: 403 });
  const searchParams = new URL(request.url).searchParams;
  const requestedRange = searchParams.get("range") || "7d";
  if (!Object.hasOwn(ranges, requestedRange))
    return jsonNoStore({ error: "invalid range" }, { status: 400 });
  const range = requestedRange as Range;
  const summaryOnly = searchParams.get("summary") === "1";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(supabase, user.id)))
    return jsonNoStore({ error: "forbidden" }, { status: 403 });

  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) return jsonNoStore(emptyStats(false, range));

  const todayKey = seoulDateKey(new Date());
  const since = new Date(`${todayKey}T00:00:00.000Z`);
  since.setUTCDate(since.getUTCDate() - ranges[range].days + 1);
  const baseParams = new URLSearchParams({
    projectId,
    since: since.toISOString().slice(0, 10),
    until: todayKey,
  });
  if (process.env.VERCEL_TEAM_ID)
    baseParams.set("teamId", process.env.VERCEL_TEAM_ID);

  const query = (by: string, limit = 100) => {
    const params = new URLSearchParams(baseParams);
    params.set("by", by);
    params.set("limit", String(limit));
    return fetch(
      `https://api.vercel.com/v1/query/web-analytics/visits/aggregate?${params}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(7000),
      },
    ).then(readRows);
  };
  const queryOptional = (by: string) => query(by).catch(() => [] as unknown[]);

  try {
    const [trendRows, ...breakdownRows] = await Promise.all([
      query(ranges[range].granularity),
      ...(summaryOnly
        ? []
        : [
            queryOptional("requestPath"),
            queryOptional("country"),
            queryOptional("deviceType"),
            queryOptional("osName"),
            queryOptional("browserName"),
            queryOptional("environment"),
            queryOptional("referrerHostname"),
          ]),
    ]);
    const [
      pathRows = [],
      countryRows = [],
      deviceRows = [],
      osRows = [],
      browserRows = [],
      environmentRows = [],
      referrerRows = [],
    ] = breakdownRows;
    const points = parseTrend(trendRows);
    const totals = points.reduce(
      (sum, point) => ({
        pageviews: sum.pageviews + point.pageviews,
        visitors: sum.visitors + point.visitors,
      }),
      { pageviews: 0, visitors: 0 },
    );

    return jsonNoStore({
      configured: true,
      range,
      granularity: ranges[range].granularity,
      ...totals,
      peakPageviews: Math.max(...points.map((point) => point.pageviews), 0),
      points,
      routes: parseBreakdown(pathRows, "requestPath"),
      countries: parseBreakdown(countryRows, "country"),
      devices: parseBreakdown(deviceRows, "deviceType"),
      operatingSystems: parseBreakdown(osRows, "osName"),
      browsers: parseBreakdown(browserRows, "browserName"),
      environments: parseBreakdown(environmentRows, "environment"),
      referrers: parseBreakdown(referrerRows, "referrerHostname"),
    });
  } catch (error) {
    if (error instanceof VercelApiError && error.status === 402) {
      return jsonNoStore({
        ...emptyStats(true, range),
        rangeUnavailable: true,
        error:
          "현재 Vercel 요금제의 조회 가능 기간을 초과했습니다. Hobby 플랜은 최근 1개월까지만 조회할 수 있습니다.",
      });
    }
    console.error("Failed to load Vercel page statistics", error);
    return jsonNoStore(
      {
        ...emptyStats(true, range),
        error: "페이지 통계를 불러오지 못했습니다.",
      },
      { status: 502 },
    );
  }
}
