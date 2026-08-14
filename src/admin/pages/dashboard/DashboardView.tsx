import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Disc3,
  FileText,
  Image as ImageIcon,
  Megaphone,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { DashboardStats, PageStats, RecentItem } from "./dashboard-model";

type DashboardViewProps = {
  stats: DashboardStats;
  pageStats: PageStats;
  pageStatsLoading: boolean;
  recentItems: RecentItem[];
  primaryArtistId: string | null;
  renderedAt: Date | null;
};

const formatNumber = new Intl.NumberFormat("ko-KR");
const formatDate = new Intl.DateTimeFormat("ko-KR", {
  month: "short",
  day: "numeric",
});

export default function DashboardView({
  stats,
  pageStats,
  pageStatsLoading,
  recentItems,
  primaryArtistId,
  renderedAt,
}: DashboardViewProps) {
  const artistHref = (segment: string) =>
    primaryArtistId
      ? `/admin/artists/${primaryArtistId}/${segment}`
      : "/admin/artists/new/profile";
  const inboxItems = [
    {
      count: stats.auditionPending,
      label: "접수된 지원서",
      href: "/admin/auditions/campaigns",
    },
    {
      count: stats.contactPending,
      label: "미확인 문의",
      href: "/admin/contact",
    },
    {
      count: stats.protectActive,
      label: "미확인 신고",
      href: "/admin/protect",
    },
  ];
  const contentItems = [
    {
      label: "앨범 전체",
      value: stats.albums,
      href: artistHref("discography"),
    },
    {
      label: "앨범 공개",
      value: stats.albumsPublished,
      href: artistHref("discography"),
    },
    {
      label: "앨범 초안",
      value: stats.albumsDraft,
      href: artistHref("discography"),
    },
    { label: "공지 전체", value: stats.notices, href: "/admin/notices" },
    {
      label: "공지 공개",
      value: stats.noticesPublished,
      href: "/admin/notices",
    },
    { label: "공지 초안", value: stats.noticesDraft, href: "/admin/notices" },
  ];
  const quickStartItems: Array<{
    label: string;
    detail: string;
    href: string;
    icon: LucideIcon;
  }> = [
    {
      label: "메인 앨범 정렬",
      detail: "홈 화면 노출 순서",
      href: "/admin/hero",
      icon: ImageIcon,
    },
    {
      label: "공지 관리",
      detail: "공지 작성과 공개",
      href: "/admin/notices",
      icon: Megaphone,
    },
    {
      label: "아티스트 편집",
      detail: "프로필과 콘텐츠",
      href: primaryArtistId
        ? `/admin/artists/${primaryArtistId}/profile`
        : "/admin/artists/new/profile",
      icon: UserRound,
    },
    {
      label: "페이지 통계",
      detail: "방문과 유입 분석",
      href: "/admin/analytics",
      icon: BarChart3,
    },
  ];

  return (
    <div className="desk-dashboard">
      <header className="desk-dashboard-intro">
        <div>
          <h1>대시보드</h1>
          <p>사이트 운영 현황과 최근 작업을 한눈에 확인합니다.</p>
        </div>
        <time dateTime={renderedAt?.toISOString()}>
          {renderedAt ? formatDate.format(renderedAt) : "—"}
        </time>
      </header>

      <section
        className="desk-quickstart"
        aria-labelledby="dashboard-quickstart-title"
      >
        <div className="desk-content-heading">
          <h2 id="dashboard-quickstart-title">Quick Start</h2>
          <span>자주 사용하는 기능</span>
        </div>
        <div className="desk-quickstart-grid">
          {quickStartItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Icon aria-hidden="true" />
                <span>
                  <b>{item.label}</b>
                  <small>{item.detail}</small>
                </span>
                <ArrowRight aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </section>

      <section
        className="desk-analytics-compact"
        aria-labelledby="dashboard-page-stats-title"
      >
        <div className="desk-analytics-compact-heading">
          <div>
            <h2 id="dashboard-page-stats-title">페이지 통계</h2>
            <p>최근 7일 기준</p>
          </div>
          <Link href="/admin/analytics">
            상세 통계 <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        <div
          className="desk-analytics-compact-metrics"
          aria-busy={pageStatsLoading}
        >
          <div>
            <span>페이지뷰</span>
            <strong>
              {pageStatsLoading
                ? "—"
                : formatNumber.format(pageStats.pageviews)}
            </strong>
          </div>
          <div>
            <span>방문자</span>
            <strong>
              {pageStatsLoading ? "—" : formatNumber.format(pageStats.visitors)}
            </strong>
          </div>
          <div>
            <span>최고 일별 페이지뷰</span>
            <strong>
              {pageStatsLoading
                ? "—"
                : formatNumber.format(pageStats.peakPageviews)}
            </strong>
          </div>
        </div>
        {pageStats.error && (
          <p className="desk-analytics-compact-error">{pageStats.error}</p>
        )}
      </section>

      <div className="desk-operations">
        <section
          className="desk-release-panel"
          aria-labelledby="dashboard-recent-title"
        >
          <div className="desk-panel-heading">
            <div>
              <h2 id="dashboard-recent-title">최근 편집</h2>
              <p>마지막으로 수정된 콘텐츠</p>
            </div>
            <Link href="/admin/audit-logs">
              <span>변경 이력</span>
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          <div className="desk-release-list">
            {recentItems.map((item, index) => (
              <Link key={`${item.kind}-${item.id}`} href={item.href}>
                <span className="desk-release-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="desk-release-cover">
                  {item.imageUrl ? (
                    <span
                      style={{ backgroundImage: `url(${item.imageUrl})` }}
                    />
                  ) : item.kind === "member" ? (
                    <UserRound aria-hidden="true" />
                  ) : item.kind === "schedule" ? (
                    <CalendarDays aria-hidden="true" />
                  ) : item.kind === "notice" ? (
                    <FileText aria-hidden="true" />
                  ) : (
                    <Disc3 aria-hidden="true" />
                  )}
                </span>
                <span className="desk-release-copy">
                  <b>{item.title}</b>
                  <small>{item.detail}</small>
                </span>
                {item.published === undefined ? (
                  <span />
                ) : (
                  <span
                    className={`cms-status ${item.published ? "is-live" : ""}`}
                  >
                    {item.published ? "공개" : "초안"}
                  </span>
                )}
                <span className="desk-release-arrow">
                  <ArrowRight aria-hidden="true" />
                </span>
              </Link>
            ))}
            {!recentItems.length && (
              <div className="desk-empty-row">
                아직 편집한 콘텐츠가 없습니다.
              </div>
            )}
          </div>
        </section>

        <section
          className="desk-inbox-panel"
          aria-labelledby="dashboard-inbox-title"
        >
          <div className="desk-panel-heading">
            <div>
              <h2 id="dashboard-inbox-title">확인할 항목</h2>
              <p>응답과 검토가 필요한 업무</p>
            </div>
          </div>
          <ul className="desk-inbox-list">
            {inboxItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>
                  <span className="desk-inbox-label">{item.label}</span>
                  <strong className="desk-inbox-count">
                    {formatNumber.format(item.count)}
                  </strong>
                  <ArrowRight aria-hidden="true" className="desk-inbox-arrow" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section
        className="desk-content-status"
        aria-labelledby="dashboard-content-title"
      >
        <div className="desk-content-heading">
          <h2 id="dashboard-content-title">콘텐츠 현황</h2>
          <span>공개 상태 기준</span>
        </div>
        <div className="desk-content-metrics">
          {contentItems.map((item) => (
            <Link key={item.label} href={item.href}>
              <span>{item.label}</span>
              <strong>{formatNumber.format(item.value)}</strong>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
