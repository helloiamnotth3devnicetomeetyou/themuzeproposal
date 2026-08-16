"use client";

import { createPortal } from "react-dom";
import type { Dispatch, RefObject, SetStateAction } from "react";
import {
  BarChart3,
  Building2,
  CalendarDays,
  FileText,
  History,
  Archive,
  Image,
  Inbox,
  LayoutDashboard,
  Mail,
  Music2,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import styles from "@/styles/(admin)/components/shell/SidebarSearch.module.css";
import type { SearchItem } from "./sidebar-search-data";

type ResultsPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

interface SidebarSearchResultsProps {
  isOpen: boolean;
  resultsPosition: ResultsPosition | null;
  query: string;
  groups: Record<string, SearchItem[]>;
  results: SearchItem[];
  activeIndex: number;
  pathname: string | null;
  resultsRef: RefObject<HTMLDivElement | null>;
  setActiveIndex: Dispatch<SetStateAction<number>>;
  select: (url: string) => void;
  close: () => void;
}

const getSearchIcon = (id: string): LucideIcon => {
  if (id === "dashboard") return LayoutDashboard;
  if (id === "analytics") return BarChart3;
  if (id === "hero") return Image;
  if (id === "notices" || id.endsWith("-notices")) return FileText;
  if (id === "audit-logs" || id === "history") return History;
  if (id === "retention") return Archive;
  if (id === "protect") return ShieldCheck;
  if (id === "contact") return Mail;
  if (id === "auditions") return Inbox;
  if (id === "settings") return Settings;
  if (id === "company") return Building2;
  if (id.includes("members")) return UsersRound;
  if (id.includes("discography")) return Music2;
  if (id.includes("schedule")) return CalendarDays;
  if (id.includes("profile")) return UserRound;
  return Search;
};

export default function SidebarSearchResults({
  isOpen,
  resultsPosition,
  query,
  groups,
  results,
  activeIndex,
  pathname,
  resultsRef,
  setActiveIndex,
  select,
  close,
}: SidebarSearchResultsProps) {
  if (typeof document === "undefined") return null;

  return (
    <>
      {isOpen &&
        createPortal(
          <button
            type="button"
            className={styles.backdrop}
            aria-label="검색 닫기"
            onClick={close}
          />,
          document.body,
        )}
      {isOpen &&
        resultsPosition &&
        createPortal(
          <div
            id="admin-search-results"
            className={`${styles.results} ${!query.trim() ? styles.resultsDefault : ""}`}
            ref={resultsRef}
            data-tour-id="admin-search-result"
            style={resultsPosition}
            role="listbox"
            aria-label="검색 결과"
          >
            {Object.entries(groups).map(([label, group]) => (
              <section
                className={styles.group}
                key={label}
                role="group"
                aria-label={label}
              >
                <p className={styles.groupLabel}>{label}</p>
                {group.map((item) => {
                  const index = results.indexOf(item);
                  const selected = activeIndex === index;
                  const current = pathname === item.url;
                  const Icon = getSearchIcon(item.id);
                  return (
                    <button
                      key={item.id}
                      id={`admin-search-result-${index}`}
                      type="button"
                      role="option"
                      data-search-result
                      aria-selected={selected}
                      className={`${styles.result} ${selected ? styles.resultSelected : ""} ${current ? styles.resultCurrent : ""}`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => select(item.url)}
                    >
                      <Icon className={styles.resultIcon} aria-hidden="true" />
                      <span>
                        {(item.artistName || query.trim()) && (
                          <small>{item.artistName ?? item.categoryLabel}</small>
                        )}
                        <b>{item.title}</b>
                      </span>
                    </button>
                  );
                })}
              </section>
            ))}
            {!results.length && (
              <p className={styles.empty}>일치하는 메뉴가 없습니다.</p>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
