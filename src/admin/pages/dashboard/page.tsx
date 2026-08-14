"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/core/supabase/client";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import { getAdminInboxCounts } from "@/admin/utils/inbox-counts";
import {
  emptyDashboardStats,
  emptyPageStats,
  latestRecentItems,
  type DashboardStats,
  type PageStats,
  type RecentItem,
} from "./dashboard-model";
import DashboardView from "./DashboardView";

type ArtistRef = { id: string; name: string } | null;

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>(emptyDashboardStats);
  const [pageStats, setPageStats] = useState<PageStats>(emptyPageStats);
  const [pageStatsLoading, setPageStatsLoading] = useState(true);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [primaryArtistId, setPrimaryArtistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [renderedAt, setRenderedAt] = useState<Date | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setRenderedAt(new Date()));
    return () => cancelAnimationFrame(frame);
  }, []);

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

  return (
    <DashboardView
      stats={stats}
      pageStats={pageStats}
      pageStatsLoading={pageStatsLoading}
      recentItems={recentItems}
      primaryArtistId={primaryArtistId}
      renderedAt={renderedAt}
    />
  );
}
