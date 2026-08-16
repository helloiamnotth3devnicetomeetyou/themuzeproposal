"use client";

import NextImage from "next/image";
import { usePathname } from "next/navigation";
import { type MouseEventHandler, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, LogOut, X } from "lucide-react";
import { getUserProfile, signOut } from "@/core/auth/auth";
import { getPublicAssetUrl } from "@/core/storage/public-url";
import { supabase } from "@/core/supabase/client";
import { ARTISTS_CHANGED_EVENT } from "@/core/utils/artist-events";
import { getAdminInboxCounts } from "@/admin/utils/inbox-counts";
import SidebarSearch, { type SidebarSearchContent } from "./SidebarSearch";
import SidebarNavigation, { type SidebarArtist } from "./SidebarNavigation";
import AdminOnboarding from "@/admin/onboarding/AdminOnboarding";

type Artist = SidebarArtist;
const emptySearchContent: SidebarSearchContent = {
  albums: [],
  members: [],
  schedules: [],
  notices: [],
};

export default function Sidebar({
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
  canNavigate,
}: {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  canNavigate: () => boolean;
}) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<{
    id?: string;
    email?: string;
    avatar_asset_id?: string | null;
    role?: "super_admin" | "editor" | null;
  } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [searchContent, setSearchContent] =
    useState<SidebarSearchContent>(emptySearchContent);
  const [profileLoading, setProfileLoading] = useState(true);
  const [artistsLoading, setArtistsLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({
    auditions: 0,
    contacts: 0,
    reports: 0,
  });
  const [expandedArtist, setExpandedArtist] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >(() => {
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
      localStorage.setItem(
        "admin-sidebar-collapsed-groups",
        JSON.stringify(next),
      );
      return next;
    });
  };

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      const nextProfile = await getUserProfile();
      if (!active) return;
      setProfile(nextProfile);
      setProfileLoading(false);
      setAvatarUrl(null);
      if (!nextProfile?.avatar_asset_id) return;

      const { data } = await supabase
        .from("avatar_assets")
        .select("image_path")
        .eq("id", nextProfile.avatar_asset_id)
        .eq("is_active", true)
        .maybeSingle();
      if (active && data?.image_path) {
        setAvatarUrl(getPublicAssetUrl("artist-assets", data.image_path));
      }
    };
    void loadProfile();
    const loadArtists = async () => {
      const [
        artistResult,
        albumResult,
        memberResult,
        scheduleResult,
        noticeResult,
      ] = await Promise.all([
        supabase.from("artists").select("id,name,logo_url").order("name"),
        supabase
          .from("albums")
          .select("id,artist_id,title,title_ko,artist:artists(name)")
          .order("updated_at", { ascending: false })
          .limit(200),
        supabase
          .from("artist_members")
          .select("id,artist_id,name,artist:artists(name)")
          .order("updated_at", { ascending: false })
          .limit(200),
        supabase
          .from("artist_schedules")
          .select("id,artist_id,title_ko,artist:artists(name)")
          .order("updated_at", { ascending: false })
          .limit(200),
        supabase
          .from("notices")
          .select("id,artist_id,title_ko,artist:artists(name)")
          .order("updated_at", { ascending: false })
          .limit(200),
      ]);
      if (!active) return;
      setArtists((artistResult.data ?? []) as Artist[]);
      setArtistsLoading(false);
      setSearchContent({
        albums: (albumResult.data ?? []).map((item) => ({
          id: item.id,
          artistId: item.artist_id,
          artistName: item.artist?.[0]?.name ?? "",
          title: item.title_ko || item.title || "제목 없는 앨범",
        })),
        members: (memberResult.data ?? []).map((item) => ({
          id: item.id,
          artistId: item.artist_id,
          artistName: item.artist?.[0]?.name ?? "",
          name: item.name || "이름 없는 멤버",
        })),
        schedules: (scheduleResult.data ?? []).map((item) => ({
          id: item.id,
          artistId: item.artist_id,
          artistName: item.artist?.[0]?.name ?? "",
          title: item.title_ko || "제목 없는 일정",
        })),
        notices: (noticeResult.data ?? []).map((item) => ({
          id: item.id,
          artistId: item.artist_id,
          artistName: item.artist?.[0]?.name ?? null,
          title: item.title_ko || "제목 없는 공지",
        })),
      });
    };
    void loadArtists();
    const refreshArtists = () => void loadArtists();
    window.addEventListener(ARTISTS_CHANGED_EVENT, refreshArtists);
    window.addEventListener("account-avatar-changed", loadProfile);
    return () => {
      active = false;
      window.removeEventListener(ARTISTS_CHANGED_EVENT, refreshArtists);
      window.removeEventListener("account-avatar-changed", loadProfile);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadUnreadCounts = () =>
      void getAdminInboxCounts(supabase)
        .then((counts) => {
          if (active) setUnreadCounts(counts);
        })
        .catch(() => {
          if (active)
            setUnreadCounts({ auditions: 0, contacts: 0, reports: 0 });
        });
    loadUnreadCounts();
    window.addEventListener("admin-inbox-changed", loadUnreadCounts);
    return () => {
      active = false;
      window.removeEventListener("admin-inbox-changed", loadUnreadCounts);
    };
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "f" ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      )
        return;
      const target = event.target as HTMLElement | null;
      if (
        target?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "")
      )
        return;
      if (!isCollapsed) return;
      event.preventDefault();
      onToggleCollapse?.();
      setTimeout(() => {
        const searchInput = document.querySelector(
          'input[type="search"]',
        ) as HTMLInputElement | null;
        if (searchInput) searchInput.focus();
      }, 120);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCollapsed, onToggleCollapse]);

  const leave = async () => {
    await signOut();
    window.location.assign("/login");
  };

  const closeAfterNavigation: MouseEventHandler<HTMLAnchorElement> = (
    event,
  ) => {
    if (!event.defaultPrevented) onClose?.();
  };

  return (
    <aside
      id="admin-navigation"
      className={`cms-sidebar ${isOpen ? "is-open" : ""} ${isCollapsed ? "is-collapsed" : ""}`}
      aria-label="관리 메뉴"
    >
      <div className="cms-sidebar-heading">
        {!isCollapsed && (
          <div className="cms-sidebar-search-container">
            <SidebarSearch
              artists={artists}
              content={searchContent}
              canNavigate={canNavigate}
              onNavigate={onClose}
            />
          </div>
        )}
        <button
          type="button"
          className="cms-sidebar-mobile-close"
          onClick={onClose}
          aria-label="관리 메뉴 닫기"
        >
          <X aria-hidden="true" />
        </button>
        {onToggleCollapse && (
          <button
            type="button"
            className="cms-sidebar-desktop-collapse"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "관리 메뉴 펼치기" : "관리 메뉴 접기"}
          >
            {isCollapsed ? (
              <ChevronRight aria-hidden="true" />
            ) : (
              <ChevronLeft aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      <SidebarNavigation
        artists={artists}
        artistsLoading={artistsLoading}
        pathname={pathname}
        isCollapsed={isCollapsed}
        isSuperAdmin={profile?.role === "super_admin"}
        unreadCounts={unreadCounts}
        collapsedGroups={collapsedGroups}
        toggleGroup={toggleGroup}
        expandedArtist={expandedArtist}
        onArtistToggle={(artistId, isExpanded) =>
          setExpandedArtist(isExpanded ? "" : artistId)
        }
        onNavigate={closeAfterNavigation}
      />
      <AdminOnboarding
        userId={profile?.id}
        role={
          profile?.role === "super_admin" || profile?.role === "editor"
            ? profile.role
            : undefined
        }
        artists={artists}
        isCollapsed={isCollapsed}
        canNavigate={canNavigate}
      />
      <div className="cms-sidebar-footer">
        <div className="cms-account">
          <span className={`cms-avatar ${profileLoading ? "is-loading" : ""}`}>
            {avatarUrl ? (
              <NextImage
                src={avatarUrl}
                alt=""
                width={30}
                height={30}
                sizes="30px"
              />
            ) : (
              (profile?.email?.[0] || "A").toUpperCase()
            )}
          </span>
          <span
            className={`cms-account-copy ${profileLoading ? "is-loading" : ""}`}
          >
            <b>{profile?.email?.split("@")[0] || "관리자"}</b>
            <small>관리자 계정</small>
          </span>
          <button
            type="button"
            onClick={leave}
            aria-label="로그아웃"
            title="로그아웃"
          >
            <LogOut aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
