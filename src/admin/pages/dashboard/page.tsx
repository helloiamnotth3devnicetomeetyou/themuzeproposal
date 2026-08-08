"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Disc3, FilePlus2, FileText, ListMusic, UserRound } from "lucide-react";
import { supabase } from "@/core/supabase/client";
import { latestRecentItems, type RecentItem } from "./dashboard-model";

type Stats = { artists: number; albums: number; members: number; notices: number; auditions: number; auditionPending: number; contactPending: number; protectReports: number; protectActive: number; upcomingSchedules: number };
type ArtistRef = { id: string; name: string } | null;
const empty: Stats = { artists: 0, albums: 0, members: 0, notices: 0, auditions: 0, auditionPending: 0, contactPending: 0, protectReports: 0, protectActive: 0, upcomingSchedules: 0 };

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
      supabase.from("audition_submissions").select("id", { count: "exact", head: true }),
      supabase.from("protect_reports").select("id", { count: "exact", head: true }),
      supabase.from("protect_reports").select("id", { count: "exact", head: true }).in("status", ["pending", "reviewing"]),
      supabase.from("audition_submissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("contact_inquiries").select("id", { count: "exact", head: true }).in("status", ["pending", "reviewing"]),
      supabase.from("artist_schedules").select("id", { count: "exact", head: true }).gte("event_date", new Date().toISOString().slice(0, 10)),
      supabase.from("albums").select("id,title,type,cover_url,is_published,updated_at,artist:artists(id,name)").order("updated_at", { ascending: false }).limit(5),
      supabase.from("artist_members").select("id,name,image_url,updated_at,artist:artists(id,name)").order("updated_at", { ascending: false }).limit(5),
      supabase.from("artist_schedules").select("id,title_ko,event_date,is_published,updated_at,artist:artists(id,name)").order("updated_at", { ascending: false }).limit(5),
      supabase.from("notices").select("id,title_ko,is_published,updated_at,artist:artists(id,name)").order("updated_at", { ascending: false }).limit(5),
      supabase.from("artists").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle(),
    ]).then(([artists, albums, members, notices, auditions, protectReports, protectActive, auditionPending, contactPending, upcomingSchedules, recentAlbums, recentMembers, recentSchedules, recentNotices, primaryArtist]) => {
      setStats({ artists: artists.count || 0, albums: albums.count || 0, members: members.count || 0, notices: notices.count || 0, auditions: auditions.count || 0, auditionPending: auditionPending.count || 0, contactPending: contactPending.count || 0, protectReports: protectReports.count || 0, protectActive: protectActive.count || 0, upcomingSchedules: upcomingSchedules.count || 0 });
      const albumItems = (recentAlbums.data ?? []).map((item) => { const artist = item.artist as unknown as ArtistRef; return { id: item.id, kind: "album" as const, title: item.title, detail: `${artist?.name || "THE MUZE"} · ${item.type}`, updatedAt: item.updated_at, href: `/admin/artists/${artist?.id || "new"}/discography?album=${item.id}`, imageUrl: item.cover_url, published: item.is_published }; });
      const memberItems = (recentMembers.data ?? []).map((item) => { const artist = item.artist as unknown as ArtistRef; return { id: item.id, kind: "member" as const, title: item.name, detail: `${artist?.name || "아티스트"} · 멤버`, updatedAt: item.updated_at, href: `/admin/artists/${artist?.id || "new"}/members`, imageUrl: item.image_url }; });
      const scheduleItems = (recentSchedules.data ?? []).map((item) => { const artist = item.artist as unknown as ArtistRef; return { id: item.id, kind: "schedule" as const, title: item.title_ko, detail: `${artist?.name || "아티스트"} · ${item.event_date}`, updatedAt: item.updated_at, href: `/admin/artists/${artist?.id || "new"}/schedule`, published: item.is_published }; });
      const noticeItems = (recentNotices.data ?? []).map((item) => { const artist = item.artist as unknown as ArtistRef; return { id: item.id, kind: "notice" as const, title: item.title_ko, detail: artist?.name || "전체 공지", updatedAt: item.updated_at, href: artist ? `/admin/artists/${artist.id}/notices` : "/admin/notices", published: item.is_published }; });
      setRecentItems(latestRecentItems([albumItems, memberItems, scheduleItems, noticeItems]));
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

  return <div className="desk-dashboard">
    <section className="desk-metrics">{metrics.map((item) => <Link key={item.label} href={item.href} className="desk-metric"><span>{item.code}</span><strong>{item.value}</strong><div><b>{item.label}</b><i>관리하기 →</i></div></Link>)}</section>
    <section className="desk-dashboard-main">
      <div className="desk-release-panel">
        <div className="desk-panel-heading"><div><h2>최근 편집</h2></div><Link href="/admin/audit-logs"><span>변경 이력 열기</span><ArrowRight aria-hidden="true" /></Link></div>
        <div className="desk-release-list">{recentItems.map((item, index) => <Link key={`${item.kind}-${item.id}`} href={item.href}><span className="desk-release-number">{String(index + 1).padStart(2, "0")}</span><span className="desk-release-cover">{item.imageUrl ? <span style={{ backgroundImage: `url(${item.imageUrl})` }} /> : item.kind === "member" ? <UserRound aria-hidden="true" /> : item.kind === "schedule" ? <CalendarDays aria-hidden="true" /> : item.kind === "notice" ? <FileText aria-hidden="true" /> : <Disc3 aria-hidden="true" />}</span><span className="desk-release-copy"><b>{item.title}</b><small>{item.detail}</small></span>{item.published === undefined ? <span /> : <span className={`cms-status ${item.published ? "is-live" : ""}`}>{item.published ? "공개" : "초안"}</span>}<span className="desk-release-arrow"><ArrowRight aria-hidden="true" /></span></Link>)}{!recentItems.length && <div className="desk-empty-row">아직 편집한 콘텐츠가 없습니다.</div>}</div>
      </div>
      <aside className="desk-inbox-stack">
        <h2 className="desk-today-title">오늘 처리할 일</h2>
        <Link href="/admin/auditions/campaigns" className="desk-inbox-card">
          <span>AUDITION</span>
          <strong>{stats.auditionPending}</strong>
          <div>
            <h2>접수된 지원서</h2>
            <i><ArrowRight aria-hidden="true" /></i>
          </div>
        </Link>
        <Link href="/admin/contact" className="desk-inbox-card"><span>CONTACT</span><strong>{stats.contactPending}</strong><div><h2>답변 대기 문의</h2><i><ArrowRight aria-hidden="true" /></i></div></Link>
        <Link href="/admin/protect" className="desk-inbox-card is-protect"><span>PROTECT · 전체 {stats.protectReports}</span><strong>{stats.protectActive}</strong><div><h2>확인 필요한 신고</h2><i><ArrowRight aria-hidden="true" /></i></div></Link>
        <Link href={artistHref("schedule")} className="desk-inbox-card"><span>SCHEDULE</span><strong>{stats.upcomingSchedules}</strong><div><h2>오늘 이후 일정</h2><i><ArrowRight aria-hidden="true" /></i></div></Link>
      </aside>
    </section>
    <section className="desk-shortcuts"><div><h2>바로 시작하기</h2></div><Link href={artistHref("discography")}><span><Disc3 aria-hidden="true" /></span><b>새 앨범 만들기</b><small>앨범 정보와 트랙 등록</small></Link><Link href="/admin/hero"><span><ListMusic aria-hidden="true" /></span><b>메인 앨범 정렬</b><small>공개 앨범 상위 5개 노출 관리</small></Link><Link href="/admin/notices"><span><FilePlus2 aria-hidden="true" /></span><b>공지 작성하기</b><small>새 소식 발행</small></Link></section>
  </div>;
}
