export type RecentItem = {
  id: string;
  kind: "album" | "member" | "schedule" | "notice";
  title: string;
  detail: string;
  updatedAt: string;
  href: string;
  imageUrl?: string | null;
  published?: boolean;
};

export type DashboardStats = {
  albums: number;
  notices: number;
  auditionPending: number;
  contactPending: number;
  protectActive: number;
  albumsPublished: number;
  albumsDraft: number;
  noticesPublished: number;
  noticesDraft: number;
};

export const emptyDashboardStats: DashboardStats = {
  albums: 0,
  notices: 0,
  auditionPending: 0,
  contactPending: 0,
  protectActive: 0,
  albumsPublished: 0,
  albumsDraft: 0,
  noticesPublished: 0,
  noticesDraft: 0,
};

export type PageStatPoint = {
  timestamp: string;
  pageviews: number;
  visitors: number;
};
export type AnalyticsRange = "7d" | "30d" | "12w" | "12m";
export type AnalyticsBreakdown = {
  name: string;
  pageviews: number;
  visitors: number;
};
export type PageStats = {
  configured: boolean;
  range: AnalyticsRange;
  granularity: "day" | "week" | "month";
  pageviews: number;
  visitors: number;
  peakPageviews: number;
  points: PageStatPoint[];
  routes: AnalyticsBreakdown[];
  countries: AnalyticsBreakdown[];
  devices: AnalyticsBreakdown[];
  operatingSystems: AnalyticsBreakdown[];
  browsers: AnalyticsBreakdown[];
  environments: AnalyticsBreakdown[];
  referrers: AnalyticsBreakdown[];
  rangeUnavailable?: boolean;
  error?: string;
};

export const emptyPageStats: PageStats = {
  configured: false,
  range: "7d",
  granularity: "day",
  pageviews: 0,
  visitors: 0,
  peakPageviews: 0,
  points: [],
  routes: [],
  countries: [],
  devices: [],
  operatingSystems: [],
  browsers: [],
  environments: [],
  referrers: [],
};

export const latestRecentItems = (groups: RecentItem[][], limit = 5) =>
  groups
    .flat()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit);

export const chartCoordinates = (
  values: number[],
  width: number,
  height: number,
  padding = 16,
) => {
  const max = Math.max(...values, 1);
  const step =
    values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;
  return values.map((value, index) => ({
    x: padding + step * index,
    y: height - padding - (value / max) * (height - padding * 2),
  }));
};

export const chartPoints = (
  values: number[],
  width: number,
  height: number,
  padding = 16,
) =>
  chartCoordinates(values, width, height, padding)
    .map(({ x, y }) => `${x},${y}`)
    .join(" ");
