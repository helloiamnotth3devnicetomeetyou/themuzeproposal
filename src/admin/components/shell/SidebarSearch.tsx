"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { LuCommand, LuSearch, LuX } from "react-icons/lu";
import styles from "@/styles/(admin)/components/shell/SidebarSearch.module.css";

interface Artist { id: string; name: string; }
interface SearchItem { id: string; categoryLabel: string; title: string; url: string; artistName?: string; }
interface SidebarSearchProps { artists: Artist[]; }
type ResultsPosition = { top: number; left: number; width: number; maxHeight: number };

export default function SidebarSearch({ artists }: SidebarSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [resultsPosition, setResultsPosition] = useState<ResultsPosition | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const updateResultsPosition = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const viewportPadding = 8;
    const gap = 7;
    setResultsPosition({
      top: rect.bottom + gap,
      left: Math.max(viewportPadding, Math.min(rect.left, window.innerWidth - rect.width - viewportPadding)),
      width: rect.width,
      maxHeight: Math.max(120, Math.min(312, window.innerHeight - rect.bottom - gap - viewportPadding)),
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!wrapperRef.current?.contains(target) && !resultsRef.current?.contains(target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const items = useMemo<SearchItem[]>(() => [
    { id: "dashboard", categoryLabel: "워크스페이스", title: "대시보드", url: "/admin" },
    { id: "hero", categoryLabel: "워크스페이스", title: "메인 히어로", url: "/admin/hero" },
    { id: "notices", categoryLabel: "워크스페이스", title: "전체 공지", url: "/admin/notices" },
    { id: "audit-logs", categoryLabel: "워크스페이스", title: "관리자 변경 이력", url: "/admin/audit-logs" },
    { id: "auditions", categoryLabel: "워크스페이스", title: "오디션 지원 내역", url: "/admin/auditions" },
    { id: "protect", categoryLabel: "워크스페이스", title: "권익 보호 신고", url: "/admin/protect" },
    { id: "settings", categoryLabel: "사이트 설정", title: "사이트 설정", url: "/admin/settings" },
    { id: "new-artist", categoryLabel: "워크스페이스", title: "새 아티스트 추가", url: "/admin/artists/new/profile" },
    { id: "company", categoryLabel: "사이트 설정", title: "회사 정보", url: "/admin/settings?tab=company" },
    { id: "history", categoryLabel: "사이트 설정", title: "연혁", url: "/admin/settings?tab=history" },
    { id: "footer", categoryLabel: "사이트 설정", title: "푸터 문구", url: "/admin/settings?tab=footer" },
    { id: "social", categoryLabel: "사이트 설정", title: "소셜 링크", url: "/admin/settings?tab=social" },
    ...artists.flatMap((artist) => [
      { id: `${artist.id}-profile`, categoryLabel: "아티스트", artistName: artist.name, title: "프로필", url: `/admin/artists/${artist.id}/profile` },
      { id: `${artist.id}-profile-basic`, categoryLabel: "아티스트", artistName: artist.name, title: "프로필 - 기본 정보", url: `/admin/artists/${artist.id}/profile?tab=basic` },
      { id: `${artist.id}-profile-visual`, categoryLabel: "아티스트", artistName: artist.name, title: "프로필 - 대표 비주얼", url: `/admin/artists/${artist.id}/profile?tab=visual` },
      { id: `${artist.id}-profile-content`, categoryLabel: "아티스트", artistName: artist.name, title: "프로필 - 아티스트 소개", url: `/admin/artists/${artist.id}/profile?tab=content` },
      { id: `${artist.id}-profile-social`, categoryLabel: "아티스트", artistName: artist.name, title: "프로필 - 공식 계정", url: `/admin/artists/${artist.id}/profile?tab=social` },
      { id: `${artist.id}-profile-scenes`, categoryLabel: "아티스트", artistName: artist.name, title: "프로필 - 인터랙티브 장면", url: `/admin/artists/${artist.id}/profile?tab=scenes` },
      { id: `${artist.id}-profile-gallery`, categoryLabel: "아티스트", artistName: artist.name, title: "프로필 - 통합 갤러리", url: `/admin/artists/${artist.id}/profile?tab=gallery` },
      { id: `${artist.id}-profile-publish`, categoryLabel: "아티스트", artistName: artist.name, title: "프로필 - 공개 설정", url: `/admin/artists/${artist.id}/profile?tab=publish` },
      { id: `${artist.id}-members`, categoryLabel: "아티스트", artistName: artist.name, title: "멤버", url: `/admin/artists/${artist.id}/members` },
      { id: `${artist.id}-discography`, categoryLabel: "아티스트", artistName: artist.name, title: "음악 · 디스코그래피", url: `/admin/artists/${artist.id}/discography` },
      { id: `${artist.id}-schedule`, categoryLabel: "아티스트", artistName: artist.name, title: "일정", url: `/admin/artists/${artist.id}/schedule` },
      { id: `${artist.id}-notices`, categoryLabel: "아티스트", artistName: artist.name, title: "공지", url: `/admin/artists/${artist.id}/notices` },
    ]),
  ], [artists]);

  const results = useMemo(() => {
    const terms = query.trim().toLocaleLowerCase("ko").split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return items.filter((item) => terms.every((term) => `${item.categoryLabel} ${item.artistName ?? ""} ${item.title}`.toLocaleLowerCase("ko").includes(term)));
  }, [items, query]);

  const groups = useMemo(() => results.reduce<Record<string, SearchItem[]>>((result, item) => {
    (result[item.categoryLabel] ??= []).push(item);
    return result;
  }, {}), [results]);

  const isShowingResults = isOpen && query.trim().length > 0;

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

  const select = useCallback((url: string) => {
    router.push(url);
    if (url.includes("settings?tab=")) window.dispatchEvent(new CustomEvent("admin-settings-tab-change", { detail: url.split("tab=")[1] }));
    if (url.includes("profile?tab=")) window.dispatchEvent(new CustomEvent("admin-profile-tab-change", { detail: url.split("tab=")[1] }));
    setQuery("");
    setIsOpen(false);
    setActiveIndex(-1);
  }, [router]);

  useEffect(() => {
    if (activeIndex >= 0) resultsRef.current?.querySelectorAll<HTMLButtonElement>("[data-search-result]")[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") { setIsOpen(false); setActiveIndex(-1); return; }
    if (!isShowingResults) return;
    if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((index) => Math.min(index + 1, results.length - 1)); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)); }
    else if (event.key === "Enter" && activeIndex >= 0) { event.preventDefault(); select(results[activeIndex].url); }
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <div className={`${styles.field} ${isOpen ? styles.fieldOpen : ""}`}>
        <LuSearch className={styles.searchIcon} aria-hidden="true" />
        <input ref={inputRef} type="search" value={query} onChange={(event) => { setQuery(event.target.value); setActiveIndex(-1); }} onFocus={() => setIsOpen(true)} onKeyDown={onKeyDown} placeholder="메뉴 검색" aria-label="관리자 메뉴 검색" role="combobox" aria-autocomplete="list" aria-expanded={isShowingResults} aria-controls="admin-search-results" aria-activedescendant={activeIndex >= 0 ? `admin-search-result-${activeIndex}` : undefined} />
        {query ? <button type="button" className={styles.clear} onClick={() => { setQuery(""); setActiveIndex(-1); }} aria-label="검색어 지우기"><LuX aria-hidden="true" /></button> : <span className={styles.shortcut} aria-hidden="true"><LuCommand />K</span>}
      </div>
      {isShowingResults && resultsPosition && typeof document !== "undefined" && createPortal(
        <div id="admin-search-results" className={styles.results} ref={resultsRef} style={{ top: resultsPosition.top, left: resultsPosition.left, width: resultsPosition.width, maxHeight: resultsPosition.maxHeight } as CSSProperties} role="listbox" aria-label="검색 결과">
          {Object.entries(groups).map(([label, group]) => <section className={styles.group} key={label} role="group" aria-label={label}>
            <p className={styles.groupLabel}>{label}</p>
            {group.map((item) => {
              const index = results.indexOf(item);
              const selected = activeIndex === index;
              const current = pathname === item.url;
              return <button key={item.id} id={`admin-search-result-${index}`} type="button" role="option" data-search-result aria-selected={selected} className={`${styles.result} ${selected ? styles.resultSelected : ""} ${current ? styles.resultCurrent : ""}`} onMouseEnter={() => setActiveIndex(index)} onClick={() => select(item.url)}>
                <span>{item.artistName && <small>{item.artistName}</small>}<b>{item.title}</b></span>
              </button>;
            })}
          </section>)}
          {!results.length && <p className={styles.empty}>일치하는 메뉴가 없습니다.</p>}
        </div>,
        document.body,
      )}
    </div>
  );
}
