"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, FileText, History, Image, Inbox, LayoutDashboard, LogOut, Mail, Plus, Settings, ShieldCheck, X } from "lucide-react";
import { getUserProfile, signOut } from "@/core/auth/auth";
import { supabase } from "@/core/supabase/client";
import { ARTISTS_CHANGED_EVENT } from "@/core/utils/artist-events";
import SidebarSearch from "./SidebarSearch";
import ArtistNavGroup from "./ArtistNavGroup";

type Artist = { id: string; name: string; logo_url: string | null };

const dashboardLinks = [
  { label: "대시보드", href: "/admin", icon: LayoutDashboard },
  { label: "변경 이력", href: "/admin/audit-logs", icon: History },
];

const contentLinks = [
  { label: "메인 앨범 정렬", href: "/admin/hero", icon: Image },
  { label: "전체 공지", href: "/admin/notices", icon: FileText },
  { label: "권익 보호", href: "/admin/protect", icon: ShieldCheck },
  { label: "문의 관리", href: "/admin/contact", icon: Mail },
];

const systemLinks = [
  { label: "사이트 설정", href: "/admin/settings", icon: Settings },
];

const artistLinks = [
  { label: "프로필", segment: "profile" },
  { label: "멤버", segment: "members" },
  { label: "음악 · 디스코그래피", segment: "discography" },
  { label: "일정", segment: "schedule" },
  { label: "공지", segment: "notices" },
];

export default function Sidebar({
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<{ email?: string } | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [expandedArtist, setExpandedArtist] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("admin-sidebar-collapsed-groups");
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    }
    return {};
  });

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [groupKey]: !prev[groupKey] };
      localStorage.setItem("admin-sidebar-collapsed-groups", JSON.stringify(next));
      return next;
    });
  };

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        if (isCollapsed) {
          event.preventDefault();
          onToggleCollapse?.();
          setTimeout(() => {
            const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement | null;
            if (searchInput) {
              searchInput.focus();
            }
          }, 120);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCollapsed, onToggleCollapse]);

  const isActive = (href: string) => href === "/admin" ? pathname === href : pathname.startsWith(href);
  const leave = async () => { await signOut(); window.location.assign("/login"); };

  return (
    <aside
      id="admin-navigation"
      className={`cms-sidebar ${isOpen ? "is-open" : ""} ${isCollapsed ? "is-collapsed" : ""}`}
      aria-label="관리 메뉴"
    >
      <div className="cms-sidebar-heading">
        {!isCollapsed && (
          <div className="cms-sidebar-search-container">
            <SidebarSearch artists={artists} />
          </div>
        )}
        <button type="button" className="cms-sidebar-mobile-close" onClick={onClose} aria-label="관리 메뉴 닫기">
          <X aria-hidden="true" />
        </button>
        {onToggleCollapse && (
          <button
            type="button"
            className="cms-sidebar-desktop-collapse"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "관리 메뉴 펼치기" : "관리 메뉴 접기"}
          >
            {isCollapsed ? <ChevronRight aria-hidden="true" /> : <ChevronLeft aria-hidden="true" />}
          </button>
        )}
      </div>
      <nav className="cms-nav" aria-label="관리자 메뉴">
        {/* Dashboard Group */}
        <div className={`cms-nav-section ${collapsedGroups.analytics ? "is-collapsed-group" : ""}`}>
          <div className="cms-nav-label-row clickable" onClick={() => toggleGroup("analytics")}>
            <p className="cms-nav-label">분석</p>
            <span className="cms-group-toggle-arrow">
              {collapsedGroups.analytics ? "▶" : "▼"}
            </span>
          </div>
          <div className="cms-nav-group-items">
            {dashboardLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
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
        </div>

        {/* Content Group */}
        <div className={`cms-nav-section ${collapsedGroups.service ? "is-collapsed-group" : ""}`}>
          <div className="cms-nav-label-row clickable" onClick={() => toggleGroup("service")}>
            <p className="cms-nav-label">서비스 관리</p>
            <span className="cms-group-toggle-arrow">
              {collapsedGroups.service ? "▶" : "▼"}
            </span>
          </div>
          <div className="cms-nav-group-items">
            {contentLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
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
        </div>

        {/* System Group */}
        <div className={`cms-nav-section ${collapsedGroups.system ? "is-collapsed-group" : ""}`}>
          <div className="cms-nav-label-row clickable" onClick={() => toggleGroup("system")}>
            <p className="cms-nav-label">시스템</p>
            <span className="cms-group-toggle-arrow">
              {collapsedGroups.system ? "▶" : "▼"}
            </span>
          </div>
          <div className="cms-nav-group-items">
            {systemLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
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
        </div>

        {/* Artist Group */}
        <div className={`cms-nav-section cms-artist-section ${collapsedGroups.artist ? "is-collapsed-group" : ""}`}>
          <div className="cms-nav-label-row clickable" onClick={() => toggleGroup("artist")}>
            <div className="cms-nav-label-left">
              <p className="cms-nav-label">아티스트</p>
              <span className="cms-group-toggle-arrow">
                {collapsedGroups.artist ? "▶" : "▼"}
              </span>
            </div>
            {!isCollapsed && !collapsedGroups.artist && (
              <Link
                href="/admin/artists/new/profile"
                className="cms-add-artist"
                aria-label="아티스트 추가"
                onClick={(e) => e.stopPropagation()}
              >
                <Plus aria-hidden="true" />
              </Link>
            )}
          </div>
          <div className="cms-nav-group-items">
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
            <LogOut aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
