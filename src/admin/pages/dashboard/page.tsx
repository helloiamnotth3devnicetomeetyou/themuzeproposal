"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Disc3, FilePlus2, ListMusic, Lock } from "lucide-react";
import { supabase } from "@/core/supabase/client";

type Stats = { artists: number; albums: number; members: number; notices: number; auditions: number; protectReports: number; protectActive: number };
type RecentAlbum = { id: string; title: string; type: string; cover_url: string | null; is_published: boolean; artist: { id: string; name: string } | null };
const empty: Stats = { artists: 0, albums: 0, members: 0, notices: 0, auditions: 0, protectReports: 0, protectActive: 0 };

export default function AdminDashboard() {
  const [stats, setStats] = useState(empty);
  const [recentAlbums, setRecentAlbums] = useState<RecentAlbum[]>([]);
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
      supabase.from("albums").select("id,title,type,cover_url,is_published,artist:artists(id,name)").order("updated_at", { ascending: false }).limit(5),
      supabase.from("artists").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle(),
    ]).then(([artists, albums, members, notices, auditions, protectReports, protectActive, recent, primaryArtist]) => {
      setStats({ artists: artists.count || 0, albums: albums.count || 0, members: members.count || 0, notices: notices.count || 0, auditions: auditions.count || 0, protectReports: protectReports.count || 0, protectActive: protectActive.count || 0 });
      setRecentAlbums((recent.data ?? []) as unknown as RecentAlbum[]);
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
        <div className="desk-panel-heading"><div><h2>최근 수정한 앨범</h2></div><Link href={artistHref("discography")}><span>앨범 라이브러리 열기</span><ArrowRight aria-hidden="true" /></Link></div>
        <div className="desk-release-list">{recentAlbums.map((album, index) => <Link key={album.id} href={`/admin/artists/${album.artist?.id || primaryArtistId || "new"}/discography?album=${album.id}`}><span className="desk-release-number">{String(index + 1).padStart(2, "0")}</span><span className="desk-release-cover">{album.cover_url ? <span style={{ backgroundImage: `url(${album.cover_url})` }} /> : <i />}</span><span className="desk-release-copy"><b>{album.title}</b><small>{album.artist?.name || "THE MUZE"} · {album.type}</small></span><span className={`cms-status ${album.is_published ? "is-live" : ""}`}>{album.is_published ? "공개" : "초안"}</span><span className="desk-release-arrow"><ArrowRight aria-hidden="true" /></span></Link>)}{!recentAlbums.length && <div className="desk-empty-row">아직 등록된 앨범이 없습니다.</div>}</div>
      </div>
      <aside className="desk-inbox-stack">
        <div className="desk-inbox-card is-locked">
          <span>AUDITION</span>
          <strong>{stats.auditions}</strong>
          <div>
            <h2>접수된 지원서</h2>
            <i className="text-[var(--text-faint)]"><Lock className="w-3 h-3" aria-hidden="true" /></i>
          </div>
          <div className="desk-inbox-locked-overlay">
            <span>협의 후 개발</span>
          </div>
        </div>
        <Link href="/admin/protect" className="desk-inbox-card is-protect"><span>PROTECT · 전체 {stats.protectReports}</span><strong>{stats.protectActive}</strong><div><h2>확인 필요한 신고</h2><i><ArrowRight aria-hidden="true" /></i></div></Link>
      </aside>
    </section>
    <section className="desk-shortcuts"><div><h2>바로 시작하기</h2></div><Link href={artistHref("discography")}><span><Disc3 aria-hidden="true" /></span><b>새 앨범 만들기</b><small>앨범 정보와 트랙 등록</small></Link><Link href={artistHref("discography")}><span><ListMusic aria-hidden="true" /></span><b>메인 앨범 정렬</b><small>공개 앨범 상위 5개 노출 관리</small></Link><Link href="/admin/notices"><span><FilePlus2 aria-hidden="true" /></span><b>공지 작성하기</b><small>새 소식 발행</small></Link></section>
  </div>;
}
