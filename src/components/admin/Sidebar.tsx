"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useRef } from "react";
import {
  LuChevronDown,
  LuFileText,
  LuImage,
  LuInbox,
  LuLayoutDashboard,
  LuLogOut,
  LuPlus,
  LuSettings,
  LuShieldCheck,
  LuSearch,
} from "react-icons/lu";
import { getUserProfile, signOut } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ARTISTS_CHANGED_EVENT } from "@/lib/artist-events";

type Artist = { id: string; name: string; logo_url: string | null };

interface SearchItem {
  id: string;
  categoryLabel: string;
  title: string;
  url: string;
  artistName?: string;
}

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
  const router = useRouter();
  const [profile, setProfile] = useState<{ email?: string } | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [expandedArtist, setExpandedArtist] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

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

  // Listen for Ctrl+K / Cmd+K to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (href: string) => href === "/admin" ? pathname === href : pathname.startsWith(href);
  const leave = async () => { await signOut(); window.location.assign("/login"); };

  // All searchable items compiled
  const allSearchItems = useMemo<SearchItem[]>(() => {
    const items: SearchItem[] = [
      { id: "ws-dash", categoryLabel: "워크스페이스", title: "대시보드", url: "/admin" },
      { id: "ws-hero", categoryLabel: "워크스페이스", title: "메인 앨범 정렬", url: "/admin/hero" },
      { id: "ws-notices", categoryLabel: "워크스페이스", title: "전체 공지사항", url: "/admin/notices" },
      { id: "ws-auditions", categoryLabel: "워크스페이스", title: "오디션 지원내역", url: "/admin/auditions" },
      { id: "ws-protect", categoryLabel: "워크스페이스", title: "권익 보호 제보", url: "/admin/protect" },
      { id: "ws-settings", categoryLabel: "워크스페이스", title: "사이트 설정", url: "/admin/settings" },
      { id: "ws-new-artist", categoryLabel: "워크스페이스", title: "신규 아티스트 추가", url: "/admin/artists/new/profile" },

      { id: "set-company", categoryLabel: "사이트 설정", title: "회사 정보 설정", url: "/admin/settings?tab=company" },
      { id: "set-history", categoryLabel: "사이트 설정", title: "연혁 설정", url: "/admin/settings?tab=history" },
      { id: "set-footer", categoryLabel: "사이트 설정", title: "푸터 카피라이트 설정", url: "/admin/settings?tab=footer" },
      { id: "set-social", categoryLabel: "사이트 설정", title: "소셜 채널 링크 설정", url: "/admin/settings?tab=social" },
    ];

    artists.forEach((artist) => {
      items.push(
        { id: `art-${artist.id}-prof`, categoryLabel: "아티스트", artistName: artist.name, title: "프로필", url: `/admin/artists/${artist.id}/profile` },
        { id: `art-${artist.id}-memb`, categoryLabel: "아티스트", artistName: artist.name, title: "멤버", url: `/admin/artists/${artist.id}/members` },
        { id: `art-${artist.id}-disco`, categoryLabel: "아티스트", artistName: artist.name, title: "음악 · 디스코그래피", url: `/admin/artists/${artist.id}/discography` },
        { id: `art-${artist.id}-sched`, categoryLabel: "아티스트", artistName: artist.name, title: "일정", url: `/admin/artists/${artist.id}/schedule` },
        { id: `art-${artist.id}-notic`, categoryLabel: "아티스트", artistName: artist.name, title: "공지", url: `/admin/artists/${artist.id}/notices` }
      );
    });

    return items;
  }, [artists]);

  // Filter items based on query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const tokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    return allSearchItems.filter((item) => {
      const matchText = `${item.title} ${item.categoryLabel} ${item.artistName || ""}`.toLowerCase();
      return tokens.every((token) => matchText.includes(token));
    });
  }, [searchQuery, allSearchItems]);

  const handleSelect = (url: string) => {
    router.push(url);
    if (url.includes("settings?tab=")) {
      const tabName = url.split("tab=")[1];
      if (tabName) {
        window.dispatchEvent(new CustomEvent("admin-settings-tab-change", { detail: tabName }));
      }
    }
    setSearchQuery("");
    setIsFocused(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  // Group search results by category
  const groupedResults = useMemo(() => {
    const groups: { [key: string]: SearchItem[] } = {};
    filteredItems.forEach((item) => {
      if (!groups[item.categoryLabel]) {
        groups[item.categoryLabel] = [];
      }
      groups[item.categoryLabel].push(item);
    });
    return groups;
  }, [filteredItems]);

  const showSuggestions = isFocused && searchQuery.trim().length > 0;

  // Scroll active suggestion into view
  useEffect(() => {
    if (activeIndex < 0 || !suggestionsRef.current) return;
    const items = suggestionsRef.current.querySelectorAll<HTMLButtonElement>(".cms-search-result-item");
    items[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // Reset activeIndex when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [filteredItems]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filteredItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && filteredItems[activeIndex]) {
        handleSelect(filteredItems[activeIndex].url);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsFocused(false);
      setActiveIndex(-1);
    }
  };

  return (
    <aside className="cms-sidebar">
      <nav className="cms-nav" aria-label="관리자 메뉴">
        {/* Inline Search Wrapper */}
        <div className="cms-search-wrapper" ref={wrapperRef}>
          <div className="cms-search-inline">
            <LuSearch aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={showSuggestions}
              aria-controls="cms-search-listbox"
              aria-activedescendant={activeIndex >= 0 ? `cms-search-item-${activeIndex}` : undefined}
              aria-autocomplete="list"
              className="cms-search-inline-input"
              placeholder="메뉴 및 설정 검색... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onKeyDown={handleInputKeyDown}
            />
            {searchQuery && (
              <button
                type="button"
                className="cms-search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="검색어 지우기"
              >
                &times;
              </button>
            )}
          </div>

          {/* Suggestions Dropdown Popover */}
          {showSuggestions && (
            <div
              id="cms-search-listbox"
              className="cms-search-suggestions"
              ref={suggestionsRef}
              role="listbox"
              aria-label="검색 제안"
            >
              {Object.keys(groupedResults).length > 0 ? (
                Object.entries(groupedResults).map(([catLabel, items]) => (
                  <div key={catLabel} className="cms-search-result-group" role="group" aria-label={catLabel}>
                    <div className="cms-search-result-group-label" aria-hidden="true">{catLabel}</div>
                    {items.map((item) => {
                      const absoluteIndex = filteredItems.indexOf(item);
                      const isHighlighted = absoluteIndex === activeIndex;
                      const isCurrent = pathname === item.url ||
                        (item.url.includes("settings?tab=") &&
                          pathname === "/admin/settings" &&
                          new URLSearchParams(item.url.split("?")[1]).get("tab") ===
                            new URLSearchParams(window.location.search).get("tab"));
                      return (
                        <button
                          key={item.id}
                          id={`cms-search-item-${absoluteIndex}`}
                          type="button"
                          role="option"
                          aria-selected={isHighlighted}
                          className={["cms-search-result-item", isHighlighted ? "is-highlighted" : "", isCurrent ? "is-active" : ""].filter(Boolean).join(" ")}
                          onClick={() => handleSelect(item.url)}
                        >
                          {item.artistName ? (
                            <span>
                              <span className="cms-search-artist-tag">{item.artistName}</span>
                              {" "}{item.title}
                            </span>
                          ) : (
                            <span>{item.title}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              ) : (
                <div className="cms-search-empty">검색 결과가 없습니다.</div>
              )}
            </div>
          )}
        </div>

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
              <div
                className={`cms-artist-group ${isExpanded ? "is-expanded" : ""}`}
                key={artist.id}
              >
                <button
                  type="button"
                  className="cms-artist-heading"
                  onClick={() => setExpandedArtist(isExpanded ? "" : artist.id)}
                  aria-expanded={isExpanded}
                >
                  <span>
                    <span className="cms-artist-logo">
                      {artist.logo_url ? (
                        <Image
                          src={artist.logo_url}
                          alt=""
                          width={20}
                          height={20}
                          unoptimized
                          className={
                            /\.svg(?:$|\?)/i.test(artist.logo_url)
                              ? "is-theme-svg"
                              : undefined
                          }
                        />
                      ) : (
                        <i />
                      )}
                    </span>
                    {artist.name}
                  </span>
                  <b>
                    <LuChevronDown aria-hidden="true" />
                  </b>
                </button>
                {isExpanded && (
                  <div className="cms-artist-links">
                    {artistLinks.map((item) => {
                      const href = `/admin/artists/${artist.id}/${item.segment}`;
                      return (
                        <Link
                          key={item.label}
                          href={href}
                          className={`cms-artist-link ${
                            pathname === href ||
                            (item.label === "음악 · 디스코그래피" &&
                              pathname.includes(`/artists/${artist.id}/tracks`))
                              ? "is-active"
                              : ""
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
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
