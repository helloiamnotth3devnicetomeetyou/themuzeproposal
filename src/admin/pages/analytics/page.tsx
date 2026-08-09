"use client";

import { useEffect, useState } from "react";
import {
  chartCoordinates,
  chartPoints,
  emptyPageStats,
  type AnalyticsBreakdown,
  type AnalyticsRange,
  type PageStats,
} from "@/admin/pages/dashboard/dashboard-model";

const formatNumber = new Intl.NumberFormat("ko-KR");
const formatDate = new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" });
const formatMonth = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "short" });
const countryNames = new Intl.DisplayNames(["ko"], { type: "region" });
const deviceNames: Record<string, string> = { mobile: "모바일", desktop: "데스크톱", tablet: "태블릿" };
const ranges: { value: AnalyticsRange; label: string; unit: string; granularity: PageStats["granularity"] }[] = [
  { value: "7d", label: "7일", unit: "일별", granularity: "day" },
  { value: "30d", label: "30일", unit: "일별", granularity: "day" },
  { value: "12w", label: "12주", unit: "주별", granularity: "week" },
  { value: "12m", label: "12개월", unit: "월별", granularity: "month" },
];

const pointLabel = (timestamp: string, granularity: PageStats["granularity"]) => {
  const date = new Date(timestamp);
  if (granularity === "month") return formatMonth.format(date);
  return `${formatDate.format(date)}${granularity === "week" ? " 주" : ""}`;
};

function BreakdownPanel({ title, items, formatName = (name: string) => name }: {
  title: string;
  items: AnalyticsBreakdown[];
  formatName?: (name: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const max = Math.max(...items.map((item) => item.pageviews), 1);
  const visibleItems = expanded ? items : items.slice(0, 4);
  return (
    <article className="desk-breakdown-panel">
      <h3>{title}</h3>
      {items.length ? <ol>{visibleItems.map((item) => (
        <li key={item.name}>
          <div><span title={formatName(item.name)}>{formatName(item.name)}</span><strong>{formatNumber.format(item.pageviews)}</strong></div>
          <div className="desk-breakdown-bar" aria-hidden="true"><i style={{ width: `${(item.pageviews / max) * 100}%` }} /></div>
          <small>{formatNumber.format(item.visitors)}명 방문</small>
        </li>
      ))}</ol> : <p>표시할 데이터가 없습니다.</p>}
      {items.length > 4 && <button type="button" className="desk-breakdown-more" onClick={() => setExpanded((value) => !value)}>{expanded ? "접기" : "더보기"}</button>}
    </article>
  );
}

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>("7d");
  const [fetchedStats, setStats] = useState<PageStats>(emptyPageStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (range === "12w" || range === "12m") {
      return;
    }
    const controller = new AbortController();
    const rangeConfig = ranges.find((item) => item.value === range) || ranges[0];
    void fetch(`/api/admin/page-stats?range=${range}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as PageStats;
        if (!response.ok) throw new Error(result.error || "페이지 통계를 불러오지 못했습니다.");
        setStats(result);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setStats({
          ...emptyPageStats,
          configured: true,
          range,
          granularity: rangeConfig.granularity,
          error: error instanceof Error ? error.message : "페이지 통계를 불러오지 못했습니다.",
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [range]);

  const selectedRange = ranges.find((item) => item.value === range) || ranges[0];
  const stats = range === "12w" || range === "12m"
    ? { ...emptyPageStats, configured: true, range, granularity: range === "12w" ? "week" as const : "month" as const, rangeUnavailable: true, error: "실개발시 추가" }
    : fetchedStats;
  const values = stats.points.map((point) => point.pageviews);
  const coordinates = chartCoordinates(values, 680, 220);
  const linePoints = chartPoints(values, 680, 220);
  const labelStep = Math.max(1, Math.ceil(stats.points.length / 5));
  const labels = stats.points.map((point, index) => ({ point, coordinate: coordinates[index], index }))
    .filter(({ index }) => index === 0 || index === stats.points.length - 1 || index % labelStep === 0);
  const chartMessage = stats.error
    || (loading ? "페이지 통계를 불러오는 중입니다." : !stats.configured ? "Vercel API 연결 후 통계가 표시됩니다." : "선택 기간에 수집된 데이터가 없습니다.");

  const changeRange = (nextRange: AnalyticsRange) => {
    if (nextRange === range) return;
    setLoading(nextRange !== "12w" && nextRange !== "12m");
    setRange(nextRange);
  };

  return (
    <div className="desk-analytics-page">
      <header className="desk-dashboard-intro">
        <div><h1>페이지 통계</h1><p>방문 추이와 주요 유입 경로를 확인합니다.</p></div>
        <div className="desk-range-tabs" aria-label="통계 기간">
          {ranges.map((item) => <button key={item.value} type="button" className={range === item.value ? "is-active" : ""} aria-pressed={range === item.value} onClick={() => changeRange(item.value)}>{item.label}</button>)}
        </div>
      </header>

      <section className="desk-analytics" aria-labelledby="analytics-chart-title">
        <article className="desk-chart-panel">
          <div className="desk-panel-heading"><div><h2 id="analytics-chart-title">페이지뷰 추이</h2><p>{selectedRange.label} · {selectedRange.unit}</p></div><span>Vercel Web Analytics</span></div>
          <div className={`desk-chart ${loading ? "is-loading" : ""}`} aria-busy={loading}>
            {stats.points.length ? <>
              <div className="desk-chart-plot">
                <svg viewBox="0 0 680 220" role="img" aria-label={`${selectedRange.label} 페이지뷰 추이`} preserveAspectRatio="none">
                  <g className="desk-chart-grid" aria-hidden="true">
                    <line x1="16" y1="16" x2="664" y2="16" /><line x1="16" y1="63" x2="664" y2="63" /><line x1="16" y1="110" x2="664" y2="110" /><line x1="16" y1="157" x2="664" y2="157" /><line x1="16" y1="204" x2="664" y2="204" />
                  </g>
                  <polygon className="desk-chart-area" points={`${linePoints} 664,204 16,204`} aria-hidden="true" />
                  <polyline className="desk-chart-line" points={linePoints} />
                </svg>
                <div className="desk-chart-points">
                  {stats.points.map((point, index) => <button key={point.timestamp} type="button" style={{ left: `${(coordinates[index].x / 680) * 100}%`, top: `${(coordinates[index].y / 220) * 100}%` }} aria-label={`${pointLabel(point.timestamp, stats.granularity)}, 페이지뷰 ${point.pageviews}, 방문자 ${point.visitors}`}>
                    <i aria-hidden="true" /><span role="tooltip"><b>{pointLabel(point.timestamp, stats.granularity)}</b><em>페이지뷰 <strong>{formatNumber.format(point.pageviews)}</strong></em><em>방문자 <strong>{formatNumber.format(point.visitors)}</strong></em></span>
                  </button>)}
                </div>
              </div>
              <div className="desk-chart-labels" aria-hidden="true">{labels.map(({ point, coordinate }) => <span key={point.timestamp} style={{ left: `${(coordinate.x / 680) * 100}%` }}>{pointLabel(point.timestamp, stats.granularity)}</span>)}</div>
            </> : <p className={`desk-chart-empty ${stats.rangeUnavailable ? "is-limited" : ""}`}>{chartMessage}</p>}
          </div>
        </article>

        <aside className="desk-stat-summary" aria-label="페이지 통계 요약">
          <div><span>{selectedRange.label} 페이지뷰</span><strong>{formatNumber.format(stats.pageviews)}</strong></div>
          <div><span>{selectedRange.label} 방문자</span><strong>{formatNumber.format(stats.visitors)}</strong></div>
          <div><span>최고 {selectedRange.unit} 페이지뷰</span><strong>{formatNumber.format(stats.peakPageviews)}</strong></div>
        </aside>
      </section>

      {stats.configured && !stats.error && <>
        <section className="desk-breakdown-section" aria-labelledby="analytics-pages-title">
          <div className="desk-breakdown-section-heading"><h2 id="analytics-pages-title">페이지 흐름</h2><span>실제 방문 URL 기준</span></div>
          <div className="desk-breakdowns"><BreakdownPanel title="라우트별 방문" items={stats.routes} /></div>
        </section>
        <section className="desk-breakdown-section" aria-labelledby="analytics-audience-title">
          <div className="desk-breakdown-section-heading"><h2 id="analytics-audience-title">방문자 환경</h2><span>접속 환경과 유입 경로</span></div>
          <div className="desk-breakdowns">
            <BreakdownPanel title="접속 국가" items={stats.countries} formatName={(name) => countryNames.of(name) || name} />
            <BreakdownPanel title="접속 기기" items={stats.devices} formatName={(name) => deviceNames[name.toLowerCase()] || name} />
            <BreakdownPanel title="운영체제별 방문" items={stats.operatingSystems} />
            <BreakdownPanel title="브라우저별 방문" items={stats.browsers} />
            <BreakdownPanel title="환경별 방문" items={stats.environments} />
            <BreakdownPanel title="유입 경로" items={stats.referrers} formatName={(name) => name || "직접 유입"} />
          </div>
        </section>
      </>}
    </div>
  );
}
