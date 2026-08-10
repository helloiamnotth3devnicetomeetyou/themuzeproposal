"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Image, Megaphone, UserRound } from "lucide-react";
import AdminAssetImage from "@/admin/components/assets/AdminAssetImage";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import { supabase } from "@/core/supabase/client";
import styles from "./content.module.css";

type Artist = { id: string; name: string; logo_url: string | null };

const primaryLinks = [
  { title: "메인 비주얼", description: "홈 화면에 노출할 앨범을 정리합니다.", href: "/admin/hero", icon: Image },
  { title: "전체 공지", description: "사이트 전체 공지를 작성하고 공개합니다.", href: "/admin/notices", icon: Megaphone },
];

export default function AdminContentPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    setLoading(true); setError("");
    void (async () => {
      try {
        const { data, error: loadError } = await supabase.from("artists").select("id,name,logo_url").order("name");
        if (loadError) throw loadError;
        setArtists((data ?? []) as Artist[]);
      } catch (loadError: unknown) {
        setError(loadError instanceof Error ? loadError.message : "아티스트를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  if (loading) return <AdminSkeleton variant="cards" rows={4} className="min-h-[320px]" />;
  return <main className={styles.page}>
    <header className={styles.heading}><span>콘텐츠</span><h1>공개할 이야기를 관리하세요</h1><p>메인 화면과 공지, 아티스트별 콘텐츠를 빠르게 엽니다.</p></header>
    {error && <div className="hero-admin-alert is-error" role="alert"><span>{error}</span><button type="button" className="admin-btn admin-btn-secondary" onClick={load}>다시 시도</button></div>}
    <section className={styles.primary} aria-label="주요 콘텐츠">
      {primaryLinks.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} className={styles.primaryCard}><Icon aria-hidden="true" /><span><strong>{item.title}</strong><small>{item.description}</small></span><ArrowRight aria-hidden="true" /></Link>; })}
    </section>
    <section className={styles.artists} aria-labelledby="artist-content-title">
      <header><div><h2 id="artist-content-title">아티스트 콘텐츠</h2><p>프로필, 멤버, 음반, 일정과 공지를 편집합니다.</p></div><Link href="/admin/artists/new/profile" className="admin-btn admin-btn-secondary">아티스트 추가</Link></header>
      {artists.length ? <div className={styles.artistList}>{artists.map((artist) => <Link key={artist.id} href={`/admin/artists/${artist.id}/profile`} className={styles.artist}>
        <span className={styles.avatar}>{artist.logo_url ? <AdminAssetImage src={artist.logo_url} alt="" sizes="42px" className={/\.svg(?:$|\?)/i.test(artist.logo_url) ? styles.themeLogo : undefined} /> : <UserRound aria-hidden="true" />}</span><span><strong>{artist.name}</strong><small>프로필과 콘텐츠 편집</small></span><ArrowRight aria-hidden="true" />
      </Link>)}</div> : <div className={styles.empty}><UserRound aria-hidden="true" /><b>등록된 아티스트가 없습니다.</b><Link href="/admin/artists/new/profile">첫 아티스트 추가하기</Link></div>}
    </section>
  </main>;
}
