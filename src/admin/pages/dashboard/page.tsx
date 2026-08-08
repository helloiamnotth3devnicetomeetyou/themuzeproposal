"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Disc3, FilePlus2, FileText, ListMusic, UserRound } from "lucide-react";
import { supabase } from "@/core/supabase/client";
import { latestRecentItems, type RecentItem } from "./dashboard-model";

type Stats = {
  artists: number; albums: number; members: number; notices: number;
  auditionPending: number; contactPending: number;
  protectActive: number; protectReports: number;
  albumsPublished: number; albumsDraft: number;
  noticesPublished: number; notesDraft: number;
};
type ArtistRef = { id: string; name: string } | null;
const empty: Stats = {
  artists: 0, albums: 0, members: 0, notices: 0,
  auditionPending: 0, contactPending: 0,
  protectActive: 0, protectReports: 0,
  albumsPublished: 0, albumsDraft: 0,
  noticesPublished: 0, notesDraft: 0,
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(empty);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [primaryArtistId, setPrimaryArtistId] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      supabase.from("artists").select("id", { count: "exact", head: true }),
      supabase.from("albums").select("id", { count: "exact", head: true }),
      supabase.from("artist_members").select("id", { count: "exact", head: true }),
      supabase.from("notices").select("id", { count: "exact", head: true }),
      supabase.from("audition_submissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("contact_inquiries").select("id", { count: "exact", head: true }).in("status", ["pending", "reviewing"]),
      supabase.from("protect_reports").select("id", { count: "exact", head: true }).in("status", ["pending", "reviewing"]),
      supabase.from("protect_reports").select("id", { count: "exact", head: true }),
      supabase.from("albums").select("id", { count: "exact", head: true }).eq("is_published", true),
      supabase.from("albums").select("id", { count: "exact", head: true }).eq("is_published", false),
      supabase.from("notices").select("id", { count: "exact", head: true }).eq("is_published", true),
      supabase.from("notices").select("id", { count: "exact", head: true }).eq("is_published", false),
      supabase.from("albums").select("id,title,type,cover_url,is_published,updated_at,artist:artists(id,name)").order("updated_at", { ascending: false }).limit(10),
      supabase.from("artist_members").select("id,name,image_url,updated_at,artist:artists(id,name)").order("updated_at", { ascending: false }).limit(10),
      supabase.from("artist_schedules").select("id,title_ko,event_date,is_published,updated_at,artist:artists(id,name)").order("updated_at", { ascending: false }).limit(10),
      supabase.from("notices").select("id,title_ko,is_published,updated_at,artist:artists(id,name)").order("updated_at", { ascending: false }).limit(10),
      supabase.from("artists").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle(),
    ]).then(([artists, albums, members, notices, auditionPending, contactPending, protectActive, protectReports, albumsPublished, albumsDraft, noticesPublished, notesDraft, recentAlbums, recentMembers, recentSchedules, recentNotices, primaryArtist]) => {
      setStats({
        artists: artists.count || 0, albums: albums.count || 0,
        members: members.count || 0, notices: notices.count || 0,
        auditionPending: auditionPending.count || 0, contactPending: contactPending.count || 0,
        protectActive: protectActive.count || 0, protectReports: protectReports.count || 0,
        albumsPublished: albumsPublished.count || 0, albumsDraft: albumsDraft.count || 0,
        noticesPublished: noticesPublished.count || 0, notesDraft: notesDraft.count || 0,
      });
      const albumItems = (recentAlbums.data ?? []).map((item) => { const artist = item.artist as unknown as ArtistRef; return { id: item.id, kind: "album" as const, title: item.title, detail: `${artist?.name || "THE MUZE"} · ${item.type}`, updatedAt: item.updated_at, href: `/admin/artists/${artist?.id || "new"}/discography?album=${item.id}`, imageUrl: item.cover_url, published: item.is_published }; });
      const memberItems = (recentMembers.data ?? []).map((item) => { const artist = item.artist as unknown as ArtistRef; return { id: item.id, kind: "member" as const, title: item.name, detail: `${artist?.name || "아티스트"} · 멤버`, updatedAt: item.updated_at, href: `/admin/artists/${artist?.id || "new"}/members`, imageUrl: item.image_url }; });
      const scheduleItems = (recentSchedules.data ?? []).map((item) => { const artist = item.artist as unknown as ArtistRef; return { id: item.id, kind: "schedule" as const, title: item.title_ko, detail: `${artist?.name || "아티스트"} · ${item.event_date}`, updatedAt: item.updated_at, href: `/admin/artists/${artist?.id || "new"}/schedule`, published: item.is_published }; });
      const noticeItems = (recentNotices.data ?? []).map((item) => { const artist = item.artist as unknown as ArtistRef; return { id: item.id, kind: "notice" as const, title: item.title_ko, detail: artist?.name || "전체 공지", updatedAt: item.updated_at, href: artist ? `/admin/artists/${artist.id}/notices` : "/admin/notices", published: item.is_published }; });
      setRecentItems(latestRecentItems([albumItems, memberItems, scheduleItems, noticeItems], 10));
      setPrimaryArtistId(primaryArtist.data?.id ?? null);
    });
  }, []);

  const artistHref = (segment: string) => primaryArtistId ? `/admin/artists/${primaryArtistId}/${segment}` : "/admin/artists/new/profile";

  const metrics = [
    { label: "아티스트", value: stats.artists, href: artistHref("profile"), code: "ART" },
    { label: "멤버", value: stats.members, href: artistHref("members"), code: "MBR" },
    { label: "앨범", value: stats.albums, href: artistHref("discography"), code: "RLS" },
    { label: "공지", value: stats.notices, href: "/admin/notices", code: "NTC" },
  ];

  const inboxItems = [
    { code: "AUDITION", count: stats.auditionPending, label: "접수된 지원서", href: "/admin/auditions/campaigns", alert: false },
    { code: "CONTACT", count: stats.contactPending, label: "답변 대기 문의", href: "/admin/contact", alert: false },
    { code: "PROTECT", count: stats.protectActive, label: "확인 필요한 신고", href: "/admin/protect", alert: true },
  ];

  const contentStatus = [
    {
      label: "앨범", code: "RLS", total: stats.albums, href: artistHref("discography"),
      items: [{ label: "공개", value: stats.albumsPublished }, { label: "초안", value: stats.albumsDraft }],
    },
    {
      label: "공지", code: "NTC", total: stats.notices, href: "/admin/notices",
      items: [{ label: "공개", value: stats.noticesPublished }, { label: "초안", value: stats.notesDraft }],
    },
  ];

  return (
    <div className="desk-dashboard">

      {/* 1. 서비스 전체 현황 */}
      <section className="desk-metrics">
        {metrics.map((item) => (
          <Link key={item.label} href={item.href} className="desk-metric">
            <span>{item.code}</span>
            <strong>{item.value}</strong>
            <div><b>{item.label}</b><i>관리하기 →</i></div>
          </Link>
        ))}
      </section>

      {/* 2. 최근 편집 (메인) + 확인이 필요한 항목 */}
      <section className="desk-dashboard-main">
        <div className="desk-release-panel">
          <div className="desk-panel-heading">
            <div><h2>최근 편집</h2></div>
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
        </div>

        <aside className="desk-inbox-panel">
          <div className="desk-inbox-header">
            <span>INBOX</span>
            <h2>확인이 필요한 항목</h2>
          </div>
          <ul className="desk-inbox-list">
            {inboxItems.map((item) => (
              <li key={item.code}>
                <Link href={item.href} className={item.alert ? "is-alert" : ""}>
                  <span className="desk-inbox-code">{item.code}</span>
                  <span className="desk-inbox-label">{item.label}</span>
                  <strong className="desk-inbox-count">{item.count}</strong>
                  <ArrowRight aria-hidden="true" className="desk-inbox-arrow" />
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      {/* 3. 콘텐츠 상태 */}
      <section className="desk-content-status">
        {contentStatus.map((group) => (
          <Link key={group.code} href={group.href} className="desk-status-card">
            <div className="desk-status-card-head">
              <span>{group.code}</span>
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

      {/* 4. 바로 시작하기 */}
      <section className="desk-shortcuts">
        <div><h2>바로 시작하기</h2></div>
        <Link href={artistHref("discography")}>
          <span><Disc3 aria-hidden="true" /></span>
          <b>새 앨범 만들기</b>
          <small>앨범 정보와 트랙 등록</small>
        </Link>
        <Link href="/admin/hero">
          <span><ListMusic aria-hidden="true" /></span>
          <b>메인 앨범 정렬</b>
          <small>공개 앨범 상위 5개 노출 관리</small>
        </Link>
        <Link href="/admin/notices">
          <span><FilePlus2 aria-hidden="true" /></span>
          <b>공지 작성하기</b>
          <small>새 소식 발행</small>
        </Link>
      </section>

    </div>
  );
}
