"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Stats = { artists: number; albums: number; members: number; notices: number; auditions: number };
type RecentAlbum = { id: string; title: string; type: string; cover_url: string | null; is_published: boolean; artist: { slug: string; name: string } | null };
const empty: Stats = { artists: 0, albums: 0, members: 0, notices: 0, auditions: 0 };

export default function AdminDashboard() {
  const [stats, setStats] = useState(empty);
  const [recentAlbums, setRecentAlbums] = useState<RecentAlbum[]>([]);

  useEffect(() => {
    void Promise.all([
      supabase.from("artists").select("id", { count: "exact", head: true }),
      supabase.from("albums").select("id", { count: "exact", head: true }),
      supabase.from("artist_members").select("id", { count: "exact", head: true }),
      supabase.from("notices").select("id", { count: "exact", head: true }),
      supabase.from("audition_submissions").select("id", { count: "exact", head: true }),
      supabase.from("albums").select("id,title,type,cover_url,is_published,artist:artists(slug,name)").order("updated_at", { ascending: false }).limit(5),
    ]).then(([artists, albums, members, notices, auditions, recent]) => {
      setStats({ artists: artists.count || 0, albums: albums.count || 0, members: members.count || 0, notices: notices.count || 0, auditions: auditions.count || 0 });
      setRecentAlbums((recent.data ?? []) as unknown as RecentAlbum[]);
    });
  }, []);

  const metrics = [
    { label: "아티스트", value: stats.artists, href: "/admin/artists/rescene/profile", code: "ART" },
    { label: "멤버", value: stats.members, href: "/admin/artists/rescene/members", code: "MBR" },
    { label: "앨범", value: stats.albums, href: "/admin/artists/rescene/discography", code: "RLS" },
    { label: "공지", value: stats.notices, href: "/admin/notices", code: "NTC" },
  ];

  return <div className="desk-dashboard">
    <section className="desk-metrics">{metrics.map((item) => <Link key={item.label} href={item.href} className="desk-metric"><span>{item.code}</span><strong>{item.value}</strong><div><b>{item.label}</b><i>관리하기 →</i></div></Link>)}</section>
    <section className="desk-dashboard-main">
      <div className="desk-release-panel">
        <div className="desk-panel-heading"><div><p className="music-kicker">RECENT RELEASES</p><h2>최근 수정한 앨범</h2></div><Link href="/admin/artists/rescene/discography">앨범 라이브러리 열기 →</Link></div>
        <div className="desk-release-list">{recentAlbums.map((album, index) => <Link key={album.id} href={`/admin/artists/${album.artist?.slug || "rescene"}/discography?album=${album.id}`}><span className="desk-release-number">{String(index + 1).padStart(2, "0")}</span><span className="desk-release-cover">{album.cover_url ? <span style={{ backgroundImage: `url(${album.cover_url})` }} /> : <i />}</span><span className="desk-release-copy"><b>{album.title}</b><small>{album.artist?.name || "THE MUZE"} · {album.type}</small></span><span className={`cms-status ${album.is_published ? "is-live" : ""}`}>{album.is_published ? "공개" : "초안"}</span><span className="desk-release-arrow">→</span></Link>)}{!recentAlbums.length && <div className="desk-empty-row">아직 등록된 앨범이 없습니다.</div>}</div>
      </div>
      <aside className="desk-inbox-panel"><p className="music-kicker">AUDITION INBOX</p><strong>{stats.auditions}</strong><h2>접수된 지원서</h2><p>지원서 목록에서 지원자 정보와 첨부 자료를 확인할 수 있습니다.</p><Link href="/admin/auditions">지원서 확인하기 <span>→</span></Link></aside>
    </section>
    <section className="desk-shortcuts"><div><p className="music-kicker">QUICK ACTIONS</p><h2>바로 시작하기</h2></div><Link href="/admin/artists/rescene/discography"><span>＋</span><b>새 앨범 만들기</b><small>앨범 정보와 트랙 등록</small></Link><Link href="/admin/hero"><span>◇</span><b>메인 비주얼 편집</b><small>홈 화면 노출 관리</small></Link><Link href="/admin/notices"><span>□</span><b>공지 작성하기</b><small>새 소식 발행</small></Link></section>
  </div>;
}
