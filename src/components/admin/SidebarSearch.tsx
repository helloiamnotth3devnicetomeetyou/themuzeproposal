"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LuSearch } from "react-icons/lu";

interface Artist {
  id: string;
  name: string;
}

interface SearchItem {
  id: string;
  categoryLabel: string;
  title: string;
  url: string;
  artistName?: string;
}

interface SidebarSearchProps {
  artists: Artist[];
}

export default function SidebarSearch({ artists }: SidebarSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const [focusTrigger, setFocusTrigger] = useState(0);

  // Focus effect to bypass ref rendering warnings
  useEffect(() => {
    if (focusTrigger > 0) {
      inputRef.current?.focus();
    }
  }, [focusTrigger]);

  // Ctrl+K to focus search input
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

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const tokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    return allSearchItems.filter((item) => {
      const matchText = `${item.title} ${item.categoryLabel} ${item.artistName || ""}`.toLowerCase();
      return tokens.every((token) => matchText.includes(token));
    });
  }, [searchQuery, allSearchItems]);

  const handleSelect = useCallback((url: string) => {
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
    setFocusTrigger((t) => t + 1);
  }, [router]);

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

  // Scroll active suggestion
  useEffect(() => {
    if (activeIndex < 0 || !suggestionsRef.current) return;
    const items = suggestionsRef.current.querySelectorAll<HTMLButtonElement>(".cms-search-result-item");
    items[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

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
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleInputKeyDown}
        />
        {searchQuery && (
          <button
            type="button"
            className="cms-search-clear"
            onClick={() => {
              setSearchQuery("");
              setActiveIndex(-1);
            }}
            aria-label="검색어 지우기"
          >
            &times;
          </button>
        )}
      </div>

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
  );
}
