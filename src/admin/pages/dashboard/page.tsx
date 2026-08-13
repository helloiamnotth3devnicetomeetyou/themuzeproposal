"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Disc3,
  FileText,
  Image as ImageIcon,
  Megaphone,
  UserRound,
} from "lucide-react";
import { supabase } from "@/core/supabase/client";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import { getAdminInboxCounts } from "@/admin/utils/inbox-counts";
import {
  emptyPageStats,
  latestRecentItems,
  type PageStats,
  type RecentItem,
} from "./dashboard-model";

type Stats = {
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
type ArtistRef = { id: string; name: string } | null;

const emptyStats: Stats = {
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

const formatNumber = new Intl.NumberFormat("ko-KR");
const formatDate = new Intl.DateTimeFormat("ko-KR", {
  month: "short",
  day: "numeric",
});

export default function AdminDashboard() {
  const [stats, setStats] = useState(emptyStats);
  const [pageStats, setPageStats] = useState<PageStats>(emptyPageStats);
  const [pageStatsLoading, setPageStatsLoading] = useState(true);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [primaryArtistId, setPrimaryArtistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(() => {
    setLoading(true);
    setError("");
    void Promise.all([
      supabase.from("albums").select("id", { count: "exact", head: true }),
      supabase.from("notices").select("id", { count: "exact", head: true }),
      supabase
        .from("albums")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true),
      supabase
        .from("albums")
        .select("id", { count: "exact", head: true })
        .eq("is_published", false),
      supabase
        .from("notices")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true),
      supabase
        .from("notices")
        .select("id", { count: "exact", head: true })
        .eq("is_published", false),
      supabase
        .from("albums")
        .select(
          "id,title,type,cover_url,is_published,updated_at,artist:artists(id,name)",
        )
        .order("updated_at", { ascending: false })
        .limit(10),
      supabase
        .from("artist_members")
        .select("id,name,image_url,updated_at,artist:artists(id,name)")
        .order("updated_at", { ascending: false })
        .limit(10),
      supabase
        .from("artist_schedules")
        .select(
          "id,title_ko,event_date,is_published,updated_at,artist:artists(id,name)",
        )
        .order("updated_at", { ascending: false })
        .limit(10),
      supabase
        .from("notices")
        .select("id,title_ko,is_published,updated_at,artist:artists(id,name)")
        .order("updated_at", { ascending: false })
        .limit(10),
      supabase
        .from("artists")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
      getAdminInboxCounts(supabase),
    ])
      .then(
        ([
          albums,
          notices,
          albumsPublished,
          albumsDraft,
          noticesPublished,
          noticesDraft,
          recentAlbums,
          recentMembers,
          recentSchedules,
          recentNotices,
          primaryArtist,
          inboxCounts,
        ]) => {
          setStats({
            albums: albums.count || 0,
            notices: notices.count || 0,
            auditionPending: inboxCounts.auditions,
            contactPending: inboxCounts.contacts,
            protectActive: inboxCounts.reports,
            albumsPublished: albumsPublished.count || 0,
            albumsDraft: albumsDraft.count || 0,
            noticesPublished: noticesPublished.count || 0,
            noticesDraft: noticesDraft.count || 0,
          });
          const albumItems = (recentAlbums.data ?? []).map((item) => {
            const artist = item.artist as unknown as ArtistRef;
            return {
              id: item.id,
              kind: "album" as const,
              title: item.title,
              detail: `${artist?.name || "THE MUZE"} · ${item.type}`,
              updatedAt: item.updated_at,
              href: `/admin/artists/${artist?.id || "new"}/discography?album=${item.id}`,
              imageUrl: item.cover_url,
              published: item.is_published,
            };
          });
          const memberItems = (recentMembers.data ?? []).map((item) => {
            const artist = item.artist as unknown as ArtistRef;
            return {
              id: item.id,
              kind: "member" as const,
              title: item.name,
              detail: `${artist?.name || "아티스트"} · 멤버`,
              updatedAt: item.updated_at,
              href: `/admin/artists/${artist?.id || "new"}/members`,
              imageUrl: item.image_url,
            };
          });
          const scheduleItems = (recentSchedules.data ?? []).map((item) => {
            const artist = item.artist as unknown as ArtistRef;
            return {
              id: item.id,
              kind: "schedule" as const,
              title: item.title_ko,
              detail: `${artist?.name || "아티스트"} · ${item.event_date}`,
              updatedAt: item.updated_at,
              href: `/admin/artists/${artist?.id || "new"}/schedule`,
              published: item.is_published,
            };
          });
          const noticeItems = (recentNotices.data ?? []).map((item) => {
            const artist = item.artist as unknown as ArtistRef;
            return {
              id: item.id,
              kind: "notice" as const,
              title: item.title_ko,
              detail: artist?.name || "전체 공지",
              updatedAt: item.updated_at,
              href: artist
                ? `/admin/artists/${artist.id}/notices`
                : "/admin/notices",
              published: item.is_published,
            };
          });
          setRecentItems(
            latestRecentItems([
              albumItems,
              memberItems,
              scheduleItems,
              noticeItems,
            ]),
          );
          setPrimaryArtistId(primaryArtist.data?.id ?? null);
        },
      )
      .catch((loadError: unknown) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "대시보드를 불러오지 못했습니다.",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/page-stats?range=7d&summary=1", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = (await response.json()) as PageStats;
        if (!response.ok)
          throw new Error(result.error || "페이지 통계를 불러오지 못했습니다.");
        setPageStats(result);
      })
      .catch((statsError: unknown) => {
        if (controller.signal.aborted) return;
        setPageStats({
          ...emptyPageStats,
          configured: true,
          error:
            statsError instanceof Error
              ? statsError.message
              : "페이지 통계를 불러오지 못했습니다.",
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) setPageStatsLoading(false);
      });
    return () => controller.abort();
  }, []);

  const artistHref = (segment: string) =>
    primaryArtistId
      ? `/admin/artists/${primaryArtistId}/${segment}`
      : "/admin/artists/new/profile";

  if (loading)
    return <AdminSkeleton variant="cards" rows={4} className="min-h-[320px]" />;
  if (error)
    return (
      <div className="hero-admin-alert is-error" role="alert">
        <span>{error}</span>
        <button
          className="admin-btn admin-btn-secondary"
          type="button"
          onClick={loadDashboard}
        >
          다시 시도
        </button>
      </div>
    );

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
  const quickStartItems = [
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
        <time dateTime={new Date().toISOString()}>
          {formatDate.format(new Date())}
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
