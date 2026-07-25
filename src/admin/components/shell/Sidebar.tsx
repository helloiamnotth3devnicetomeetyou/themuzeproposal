"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LuFileText,
  LuImage,
  LuInbox,
  LuLayoutDashboard,
  LuLogOut,
  LuPlus,
  LuSettings,
  LuShieldCheck,
} from "react-icons/lu";
import { getUserProfile, signOut } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ARTISTS_CHANGED_EVENT } from "@/lib/artist-events";
import SidebarSearch from "./SidebarSearch";
import ArtistNavGroup from "./ArtistNavGroup";

type Artist = { id: string; name: string; logo_url: string | null };

const workspaceLinks = [
  { label: "대시보드", href: "/admin", icon: LuLayoutDashboard },
  { label: "메인 앨범 정렬", href: "/admin/hero", icon: LuImage },
  { label: "전체 공지", href: "/admin/notices", icon: LuFileText },
  { label: "오디션", href: "/admin/auditions", icon: LuInbox },
  { label: "권익 보호", href: "/admin/protect", icon: LuShieldCheck },
  { label: "사이트 설정", href: "/admin/settings", icon: LuSettings },
];

const artistLinks = [
  { label: "프로필", segment: "profile" },
  { label: "멤버", segment: "members" },
  { label: "음악 · 디스코그래피", segment: "discography" },
  { label: "일정", segment: "schedule" },
  { label: "공지", segment: "notices" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<{ email?: string } | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [expandedArtist, setExpandedArtist] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getUserProfile().then(setProfile);
    const loadArtists = async () => {
      const { data } = await supabase.from("artists").select("id,name,logo_url").order("name");
      if (active) setArtists((data ?? []) as Artist[]);
    };
    void loadArtists();
    const refreshArtists = () => void loadArtists();
    window.addEventListener(ARTISTS_CHANGED_EVENT, refreshArtists);
    return () => {
      active = false;
      window.removeEventListener(ARTISTS_CHANGED_EVENT, refreshArtists);
    };
  }, []);

  const isActive = (href: string) => href === "/admin" ? pathname === href : pathname.startsWith(href);
  const leave = async () => { await signOut(); window.location.assign("/login"); };

  return (
    <aside className="cms-sidebar">
      <nav className="cms-nav" aria-label="관리자 메뉴">
        {/* Isolated Search Popover */}
        <SidebarSearch artists={artists} />

        {/* Standard Nav */}
        <div className="cms-nav-section">
          <p className="cms-nav-label">워크스페이스</p>
          {workspaceLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`cms-nav-item ${isActive(item.href) ? "is-active" : ""}`}
              >
                <span className="cms-nav-icon">
                  <Icon aria-hidden="true" />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="cms-nav-section cms-artist-section">
          <div className="cms-nav-label-row">
            <p className="cms-nav-label">아티스트</p>
            <Link
              href="/admin/artists/new/profile"
              className="cms-add-artist"
              aria-label="아티스트 추가"
            >
              <LuPlus aria-hidden="true" />
            </Link>
          </div>
          {artists.map((artist) => {
            const isCurrentArtist = pathname.includes(`/artists/${artist.id}/`);
            const isExpanded =
              expandedArtist === artist.id || (expandedArtist === null && isCurrentArtist);
            return (
              <ArtistNavGroup
                key={artist.id}
                artist={artist}
                isExpanded={isExpanded}
                onToggle={() => setExpandedArtist(isExpanded ? "" : artist.id)}
                pathname={pathname}
                artistLinks={artistLinks}
              />
            );
          })}
          {!artists.length && (
            <Link href="/admin/artists/new/profile" className="cms-empty-artist">
              첫 아티스트 추가하기
            </Link>
          )}
        </div>
      </nav>
      <div className="cms-sidebar-footer">
        <div className="cms-account">
          <span className="cms-avatar">{(profile?.email?.[0] || "A").toUpperCase()}</span>
          <span className="cms-account-copy">
            <b>{profile?.email?.split("@")[0] || "관리자"}</b>
            <small>관리자 계정</small>
          </span>
          <button type="button" onClick={leave} aria-label="로그아웃" title="로그아웃">
            <LuLogOut aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
