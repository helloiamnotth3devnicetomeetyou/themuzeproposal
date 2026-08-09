"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Disc3, FileText, UserRound } from "lucide-react";
import { supabase } from "@/core/supabase/client";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import { getAdminInboxCounts } from "@/admin/utils/inbox-counts";
import { latestRecentItems, type RecentItem } from "./dashboard-model";

type Stats = {
  albums: number; notices: number;
  auditionPending: number; contactPending: number;
  protectActive: number;
  albumsPublished: number; albumsDraft: number;
  noticesPublished: number; notesDraft: number;
};
type ArtistRef = { id: string; name: string } | null;
const empty: Stats = {
  albums: 0, notices: 0,
  auditionPending: 0, contactPending: 0,
  protectActive: 0,
  albumsPublished: 0, albumsDraft: 0,
  noticesPublished: 0, notesDraft: 0,
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(empty);
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
      supabase.from("albums").select("id", { count: "exact", head: true }).eq("is_published", true),
      supabase.from("albums").select("id", { count: "exact", head: true }).eq("is_published", false),
      supabase.from("notices").select("id", { count: "exact", head: true }).eq("is_published", true),
      supabase.from("notices").select("id", { count: "exact", head: true }).eq("is_published", false),
      supabase.from("albums").select("id,title,type,cover_url,is_published,updated_at,artist:artists(id,name)").order("updated_at", { ascending: false }).limit(10),
      supabase.from("artist_members").select("id,name,image_url,updated_at,artist:artists(id,name)").order("updated_at", { ascending: false }).limit(10),
      supabase.from("artist_schedules").select("id,title_ko,event_date,is_published,updated_at,artist:artists(id,name)").order("updated_at", { ascending: false }).limit(10),
      supabase.from("notices").select("id,title_ko,is_published,updated_at,artist:artists(id,name)").order("updated_at", { ascending: false }).limit(10),
      supabase.from("artists").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle(),
      getAdminInboxCounts(supabase),
    ]).then(([albums, notices, albumsPublished, albumsDraft, noticesPublished, notesDraft, recentAlbums, recentMembers, recentSchedules, recentNotices, primaryArtist, inboxCounts]) => {
      setStats({
        albums: albums.count || 0, notices: notices.count || 0,
        auditionPending: inboxCounts.auditions, contactPending: inboxCounts.contacts,
        protectActive: inboxCounts.reports,
        albumsPublished: albumsPublished.count || 0, albumsDraft: albumsDraft.count || 0,
        noticesPublished: noticesPublished.count || 0, notesDraft: notesDraft.count || 0,
      });
      const albumItems = (recentAlbums.data ?? []).map((item) => { const artist = item.artist as unknown as ArtistRef; return { id: item.id, kind: "album" as const, title: item.title, detail: `${artist?.name || "THE MUZE"} · ${item.type}`, updatedAt: item.updated_at, href: `/admin/artists/${artist?.id || "new"}/discography?album=${item.id}`, imageUrl: item.cover_url, published: item.is_published }; });
      const memberItems = (recentMembers.data ?? []).map((item) => { const artist = item.artist as unknown as ArtistRef; return { id: item.id, kind: "member" as const, title: item.name, detail: `${artist?.name || "아티스트"} · 멤버`, updatedAt: item.updated_at, href: `/admin/artists/${artist?.id || "new"}/members`, imageUrl: item.image_url }; });
      const scheduleItems = (recentSchedules.data ?? []).map((item) => { const artist = item.artist as unknown as ArtistRef; return { id: item.id, kind: "schedule" as const, title: item.title_ko, detail: `${artist?.name || "아티스트"} · ${item.event_date}`, updatedAt: item.updated_at, href: `/admin/artists/${artist?.id || "new"}/schedule`, published: item.is_published }; });
      const noticeItems = (recentNotices.data ?? []).map((item) => { const artist = item.artist as unknown as ArtistRef; return { id: item.id, kind: "notice" as const, title: item.title_ko, detail: artist?.name || "전체 공지", updatedAt: item.updated_at, href: artist ? `/admin/artists/${artist.id}/notices` : "/admin/notices", published: item.is_published }; });
      setRecentItems(latestRecentItems([albumItems, memberItems, scheduleItems, noticeItems], 10));
      setPrimaryArtistId(primaryArtist.data?.id ?? null);
    }).catch((loadError: unknown) => {
      setError(loadError instanceof Error ? loadError.message : "대시보드를 불러오지 못했습니다.");
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  const artistHref = (segment: string) => primaryArtistId ? `/admin/artists/${primaryArtistId}/${segment}` : "/admin/artists/new/profile";

  if (loading) return <AdminSkeleton variant="cards" rows={4} className="min-h-[320px]" />;
  if (error) return <div className="hero-admin-alert is-error" role="alert"><span>{error}</span><button className="admin-btn" type="button" onClick={loadDashboard}>다시 시도</button></div>;

  const inboxItems = [
    { count: stats.auditionPending, label: "접수된 지원서", href: "/admin/auditions/campaigns", alert: false },
    { count: stats.contactPending, label: "미확인 문의", href: "/admin/contact", alert: false },
    { count: stats.protectActive, label: "미확인 신고", href: "/admin/protect", alert: true },
  ];

  const contentStatus = [
    {
      label: "앨범", total: stats.albums, href: artistHref("discography"),
      items: [{ label: "공개", value: stats.albumsPublished }, { label: "초안", value: stats.albumsDraft }],
    },
    {
      label: "공지", total: stats.notices, href: "/admin/notices",
      items: [{ label: "공개", value: stats.noticesPublished }, { label: "초안", value: stats.notesDraft }],
    },
  ];

  return (
    <div className="desk-dashboard">

      <section className="desk-inbox-panel" aria-labelledby="dashboard-inbox-title">
        <div className="desk-inbox-header">
          <h2 id="dashboard-inbox-title">확인이 필요한 항목</h2>
        </div>
        <ul className="desk-inbox-list">
          {inboxItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={item.alert ? "is-alert" : ""}>
                <span className="desk-inbox-label">{item.label}</span>
                <strong className="desk-inbox-count">{item.count}</strong>
                <ArrowRight aria-hidden="true" className="desk-inbox-arrow" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="desk-release-panel" aria-labelledby="dashboard-recent-title">
          <div className="desk-panel-heading">
            <h2 id="dashboard-recent-title">최근 편집</h2>
            <Link href="/admin/audit-logs"><span>변경 이력 열기</span><ArrowRight aria-hidden="true" /></Link>
          </div>
          <div className="desk-release-list">
            {recentItems.map((item, index) => (
              <Link key={`${item.kind}-${item.id}`} href={item.href}>
                <span className="desk-release-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="desk-release-cover">
                  {item.imageUrl
                    ? <span style={{ backgroundImage: `url(${item.imageUrl})` }} />
                    : item.kind === "member" ? <UserRound aria-hidden="true" />
                    : item.kind === "schedule" ? <CalendarDays aria-hidden="true" />
                    : item.kind === "notice" ? <FileText aria-hidden="true" />
                    : <Disc3 aria-hidden="true" />}
                </span>
                <span className="desk-release-copy">
                  <b>{item.title}</b>
                  <small>{item.detail}</small>
                </span>
                {item.published === undefined
                  ? <span />
                  : <span className={`cms-status ${item.published ? "is-live" : ""}`}>{item.published ? "공개" : "초안"}</span>}
                <span className="desk-release-arrow"><ArrowRight aria-hidden="true" /></span>
              </Link>
            ))}
            {!recentItems.length && <div className="desk-empty-row">아직 편집한 콘텐츠가 없습니다.</div>}
          </div>
      </section>

      <section className="desk-content-status" aria-label="콘텐츠 현황">
        {contentStatus.map((group) => (
          <Link key={group.label} href={group.href} className="desk-status-card">
            <div className="desk-status-card-head">
              <b>{group.label}</b>
              <strong>{group.total}<small>개</small></strong>
            </div>
            <div className="desk-status-card-body">
              {group.items.map((s) => (
                <div key={s.label} className="desk-status-item">
                  <span>{s.label}</span>
                  <b>{s.value}</b>
                </div>
              ))}
            </div>
          </Link>
        ))}
      </section>

    </div>
  );
}
