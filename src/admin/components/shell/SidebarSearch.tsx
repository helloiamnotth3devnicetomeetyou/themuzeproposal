"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import styles from "@/styles/(admin)/components/shell/SidebarSearch.module.css";
import SidebarSearchResults from "./SidebarSearchResults";
import {
  buildSearchItems,
  type Artist,
  type SearchItem,
  type SidebarSearchContent,
} from "./sidebar-search-data";
export type { SidebarSearchContent } from "./sidebar-search-data";
interface SidebarSearchProps {
  artists: Artist[];
  content: SidebarSearchContent;
  canNavigate: () => boolean;
  onNavigate?: () => void;
}
type ResultsPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

export default function SidebarSearch({
  artists,
  content,
  canNavigate,
  onNavigate,
}: SidebarSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [shortcutPulse, setShortcutPulse] = useState(0);
  const [resultsPosition, setResultsPosition] =
    useState<ResultsPosition | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const updateResultsPosition = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const viewportPadding = 8;
    const gap = 7;
    const width =
      window.innerWidth >= 1200
        ? Math.min(
            Math.max(rect.width, 420),
            window.innerWidth - viewportPadding * 2,
          )
        : rect.width;
    setResultsPosition({
      top: rect.bottom + gap,
      left: Math.max(
        viewportPadding,
        Math.min(rect.left, window.innerWidth - width - viewportPadding),
      ),
      width,
      maxHeight: Math.max(
        120,
        Math.min(360, window.innerHeight - rect.bottom - gap - viewportPadding),
      ),
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
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
      event.preventDefault();
      setShortcutPulse((value) => value + 1);
      setIsOpen(true);
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !wrapperRef.current?.contains(target) &&
        !resultsRef.current?.contains(target)
      )
        setIsOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const items = useMemo(
    () => buildSearchItems(artists, content),
    [artists, content],
  );

  const results = useMemo(() => {
    const terms = query
      .trim()
      .toLocaleLowerCase("ko")
      .split(/\s+/)
      .filter(Boolean);
    if (!terms.length)
      return items.filter((item) => !item.artistName).slice(0, 6);
    return items.filter((item) =>
      terms.every((term) =>
        `${item.categoryLabel} ${item.artistName ?? ""} ${item.title}`
          .toLocaleLowerCase("ko")
          .includes(term),
      ),
    );
  }, [items, query]);

  const groups = useMemo(
    () =>
      results.reduce<Record<string, SearchItem[]>>((result, item) => {
        (result[item.categoryLabel] ??= []).push(item);
        return result;
      }, {}),
    [results],
  );

  const isShowingResults = isOpen;

  useEffect(() => {
    if (!isShowingResults) return;
    updateResultsPosition();
    window.addEventListener("resize", updateResultsPosition);
    window.addEventListener("scroll", updateResultsPosition, true);
    return () => {
      window.removeEventListener("resize", updateResultsPosition);
      window.removeEventListener("scroll", updateResultsPosition, true);
    };
  }, [isShowingResults, updateResultsPosition]);

  const select = useCallback(
    (url: string) => {
      if (!canNavigate()) return;
      if (url === pathname) {
        setIsOpen(false);
        return;
      }
      router.push(url);
      onNavigate?.();
      if (url.includes("settings?tab="))
        window.dispatchEvent(
          new CustomEvent("admin-settings-tab-change", {
            detail: url.split("tab=")[1],
          }),
        );
      if (url.includes("profile?tab="))
        window.dispatchEvent(
          new CustomEvent("admin-profile-tab-change", {
            detail: url.split("tab=")[1],
          }),
        );
      setQuery("");
      setIsOpen(false);
      setActiveIndex(-1);
    },
    [canNavigate, onNavigate, pathname, router],
  );

  useEffect(() => {
    if (activeIndex >= 0)
      resultsRef.current
        ?.querySelectorAll<HTMLButtonElement>("[data-search-result]")
        [activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!isShowingResults) return;
    if (event.key === "ArrowDown" || (event.key === "Tab" && !event.shiftKey)) {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (
      event.key === "ArrowUp" ||
      (event.key === "Tab" && event.shiftKey)
    ) {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      select(results[activeIndex].url);
    }
  };

  return (
    <div
      className={styles.wrapper}
      ref={wrapperRef}
      data-tour-id="admin-search"
      data-search-open={isOpen ? "true" : undefined}
    >
      <div className={`${styles.field} ${isOpen ? styles.fieldOpen : ""}`}>
        <Search className={styles.searchIcon} aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            setIsOpen(true);
            setActiveIndex(results.length ? 0 : -1);
          }}
          onKeyDown={onKeyDown}
          placeholder="메뉴 검색"
          aria-label="관리자 메뉴 검색"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isShowingResults}
          aria-controls="admin-search-results"
          aria-activedescendant={
            activeIndex >= 0 ? `admin-search-result-${activeIndex}` : undefined
          }
        />
        {query ? (
          <button
            type="button"
            className={styles.clear}
            onClick={() => {
              setQuery("");
              setActiveIndex(-1);
            }}
            aria-label="검색어 지우기"
          >
            <X aria-hidden="true" />
          </button>
        ) : (
          <kbd
            key={shortcutPulse}
            className={`${styles.shortcut} ${shortcutPulse ? styles.shortcutPulse : ""}`}
            aria-hidden="true"
          >
            F
          </kbd>
        )}
      </div>
      <SidebarSearchResults
        isOpen={isShowingResults}
        resultsPosition={resultsPosition}
        query={query}
        groups={groups}
        results={results}
        activeIndex={activeIndex}
        pathname={pathname}
        resultsRef={resultsRef}
        setActiveIndex={setActiveIndex}
        select={select}
        close={() => {
          setIsOpen(false);
          setActiveIndex(-1);
        }}
      />
    </div>
  );
}
