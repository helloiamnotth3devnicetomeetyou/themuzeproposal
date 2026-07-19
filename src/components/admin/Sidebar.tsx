"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getUserProfile, signOut } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type Artist = { id: string; slug: string; name: string };

const workspaceLinks = [
  { label: "대시보드", href: "/admin", icon: "grid" },
  { label: "메인 비주얼", href: "/admin/hero", icon: "image" },
  { label: "전체 공지", href: "/admin/notices", icon: "note" },
  { label: "오디션", href: "/admin/auditions", icon: "inbox" },
  { label: "사이트 설정", href: "/admin/settings", icon: "settings" },
];

const artistLinks = [
  { label: "프로필", segment: "profile" },
  { label: "멤버", segment: "members" },
  { label: "음악 · 디스코그래피", segment: "discography" },
  { label: "공지", segment: "notices" },
];

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="m21 15-4.5-4.5L7 20" /></>,
    note: <><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
    inbox: <><path d="M4 5h16l2 9v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5z" /><path d="M2 14h5l2 3h6l2-3h5" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<{ email?: string } | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [expandedArtist, setExpandedArtist] = useState<string | null>(null);

  useEffect(() => {
    void getUserProfile().then(setProfile);
    void supabase.from("artists").select("id,slug,name").order("name").then(({ data }) => setArtists(data ?? []));
  }, []);

  const isActive = (href: string) => href === "/admin" ? pathname === href : pathname.startsWith(href);
  const leave = async () => { await signOut(); window.location.assign("/login"); };

  return <aside className="cms-sidebar">
    <div className="cms-sidebar-context"><div><span>ADMIN WORKSPACE</span><b>Content desk</b></div><i /></div>
    <nav className="cms-nav" aria-label="관리자 메뉴">
      <div className="cms-nav-section"><p className="cms-nav-label">워크스페이스</p>{workspaceLinks.map((item) => <Link key={item.href} href={item.href} className={`cms-nav-item ${isActive(item.href) ? "is-active" : ""}`}><span className="cms-nav-icon"><NavIcon name={item.icon} /></span><span>{item.label}</span></Link>)}</div>
      <div className="cms-nav-section cms-artist-section">
        <div className="cms-nav-label-row"><p className="cms-nav-label">아티스트</p><Link href="/admin/artists/new/profile" className="cms-add-artist" aria-label="아티스트 추가">+</Link></div>
        {artists.map((artist) => {
          const isCurrentArtist = pathname.includes(`/artists/${artist.slug}/`);
          const isExpanded = expandedArtist === artist.slug || (expandedArtist === null && isCurrentArtist);
          return <div className={`cms-artist-group ${isExpanded ? "is-expanded" : ""}`} key={artist.id}>
            <button type="button" className="cms-artist-heading" onClick={() => setExpandedArtist(isExpanded ? "" : artist.slug)} aria-expanded={isExpanded}><span><i />{artist.name}</span><b>⌄</b></button>
            {isExpanded && <div className="cms-artist-links">{artistLinks.map((item) => { const href = `/admin/artists/${artist.slug}/${item.segment}`; return <Link key={item.segment} href={href} className={`cms-artist-link ${pathname === href || (item.segment === "discography" && pathname.includes(`/artists/${artist.slug}/tracks`)) ? "is-active" : ""}`}>{item.label}</Link>; })}</div>}
          </div>;
        })}
        {!artists.length && <Link href="/admin/artists/new/profile" className="cms-empty-artist">첫 아티스트 추가하기</Link>}
      </div>
    </nav>
    <div className="cms-sidebar-footer"><div className="cms-account"><span className="cms-avatar">{(profile?.email?.[0] || "A").toUpperCase()}</span><span className="cms-account-copy"><b>{profile?.email?.split("@")[0] || "관리자"}</b><small>관리자 계정</small></span><button type="button" onClick={leave} aria-label="로그아웃" title="로그아웃">↗</button></div></div>
  </aside>;
}
