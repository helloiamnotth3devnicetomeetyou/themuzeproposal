"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Search, X } from "lucide-react";
import { useLocale } from "@/core/providers/LocaleContext";
import CustomSelect from "@/core/components/form/CustomSelect";
import LoadingIndicator from "@/core/components/feedback/LoadingIndicator";
import type { LocalizedTextDTO, NoticeListItemDTO, NoticeListDTO } from "@/public/features/notices/types";
import styles from "@/styles/(public)/components/notices/NoticeBoard.module.css";

type Locale = "ko" | "en" | "ja";

const pageCopy: Record<Locale, {
  description: string;
  search: string;
  closeSearch: string;
  loading: string;
  all: string;
  empty: string;
  error: string;
  count: string;
  category: string;
}> = {
  ko: {
    description: "더뮤즈의 새로운 소식과 안내를 확인하세요.",
    search: "공지 검색",
    closeSearch: "검색 닫기",
    loading: "공지를 불러오는 중…",
    all: "전체",
    empty: "조건에 맞는 공지가 없습니다.",
    error: "공지를 불러오지 못했습니다.",
    count: "개의 공지",
    category: "카테고리",
  },
  en: {
    description: "Find the latest news and updates from THE MUZE.",
    search: "Search notices",
    closeSearch: "Close search",
    loading: "Loading notices…",
    all: "All",
    empty: "No notices match your search.",
    error: "Notices could not be loaded.",
    count: " notices",
    category: "Category",
  },
  ja: {
    description: "THE MUZEの最新ニュースとお知らせをご確認ください。",
    search: "お知らせを検索",
    closeSearch: "検索を閉じる",
    loading: "お知らせを読み込み中…",
    all: "すべて",
    empty: "条件に一致するお知らせはありません。",
    error: "お知らせを読み込めませんでした。",
    count: "件のお知らせ",
    category: "カテゴリー",
  },
};

const EMPTY_NOTICES: NoticeListItemDTO[] = [];
const NOTICES_PER_PAGE = 10;
const localized = (value: LocalizedTextDTO, locale: Locale) => value[locale] || value.ko || value.en || value.ja;

export default function NoticeBoard({ artistSlug, initialData, loadFailed = false }: { artistSlug?: string; initialData: NoticeListDTO | null; loadFailed?: boolean }) {
  const { locale: activeLocale } = useLocale();
  const locale = activeLocale as Locale;
  const copy = pageCopy[locale] || pageCopy.ko;
  const notices = initialData?.notices ?? EMPTY_NOTICES;
  const scopeName = initialData?.name ?? "";
  const loading = false;
  const error = loadFailed ? copy.error : "";
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const categories = useMemo(
    () => Array.from(new Set(notices.map((notice) => localized(notice.category, locale)).filter(Boolean))),
    [notices, locale],
  );
  const selectedCategory = category === "all" || categories.includes(category) ? category : "all";
  const visibleNotices = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase();
    return notices
      .map((notice, index) => ({ notice, number: notices.length - index }))
      .filter(({ notice }) => {
        const noticeCategory = localized(notice.category, locale);
        const matchesCategory = selectedCategory === "all" || noticeCategory === selectedCategory;
        const matchesSearch = !keyword || `${localized(notice.title, locale)} ${noticeCategory}`.toLocaleLowerCase().includes(keyword);
        return matchesCategory && matchesSearch;
      });
  }, [locale, notices, search, selectedCategory]);

  const pageCount = Math.max(1, Math.ceil(visibleNotices.length / NOTICES_PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const paginatedNotices = useMemo(
    () => visibleNotices.slice((currentPage - 1) * NOTICES_PER_PAGE, currentPage * NOTICES_PER_PAGE),
    [currentPage, visibleNotices],
  );

  const heading = scopeName ? `${scopeName.toUpperCase()} NOTICE` : "NOTICE";
  const detailHref = (noticeId: string) => artistSlug ? `/${artistSlug}/notice/${noticeId}` : `/notice/${noticeId}`;
  const closeSearch = () => {
    setSearch("");
    setSearchOpen(false);
  };

  return (
    <div className={styles.pageFrame}>
      <section className={styles.board} aria-labelledby="notice-heading">
        <header className={styles.titleColumn}>
          <div className={styles.titleSticky}>
            <h1 id="notice-heading" className={artistSlug ? styles.artistHeading : undefined}>
              {artistSlug && scopeName ? <><span className={styles.artistNameLine}>{scopeName.toUpperCase()}</span><span className={styles.noticeLine}>NOTICE</span></> : heading}
            </h1>
            <p>{copy.description}</p>
            <span className={styles.total}>{String(notices.length).padStart(2, "0")} {copy.count}</span>
          </div>
        </header>

        <div className={styles.listColumn}>
          <div className={styles.toolbar}>
            <CustomSelect
              className={styles.categorySelect}
              variant="line"
              ariaLabel={copy.category}
              value={selectedCategory}
              onChange={(value) => { setCategory(value); setPage(1); }}
              options={[{ value: "all", label: copy.all }, ...categories.map((item) => ({ value: item, label: item }))]}
            />
            <div className={`${styles.searchControl} ${searchOpen ? styles.searchOpen : ""}`}>
              <label className={styles.searchField}>
                <span className="sr-only">{copy.search}</span>
                <input ref={searchInputRef} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={copy.search} tabIndex={searchOpen ? 0 : -1} />
              </label>
              {searchOpen && search ? <button type="button" onClick={closeSearch} aria-label={copy.closeSearch}><X aria-hidden="true" /></button> : <button type="button" onClick={() => setSearchOpen((open) => !open)} aria-label={searchOpen ? copy.closeSearch : copy.search}><Search aria-hidden="true" /></button>}
            </div>
          </div>

          <div className={styles.list} aria-live="polite">
            {loading && <LoadingIndicator label={copy.loading} className="min-h-[360px]" />}

            {!loading && error && <div className={`${styles.state} ${styles.error}`} role="alert"><b>!</b><p>{error}</p></div>}

            {!loading && !error && paginatedNotices.map(({ notice, number }) => (
              <Link key={notice.id} href={detailHref(notice.id)} className={styles.item}>
                <span className={styles.number}>{String(number).padStart(4, "0")}</span>
                <span className={styles.itemCopy}>
                  <span className={styles.itemCategory}>{localized(notice.category, locale) || copy.all}</span>
                  <strong>{localized(notice.title, locale)}</strong>
                  <time dateTime={notice.date}>{notice.date || "—"}</time>
                </span>
                <ArrowUpRight className={styles.itemArrow} aria-hidden="true" />
              </Link>
            ))}

            {!loading && !error && !visibleNotices.length && <div className={styles.state}><p>{copy.empty}</p></div>}
          </div>

          {!loading && !error && visibleNotices.length > NOTICES_PER_PAGE && (
            <nav className={styles.pagination} aria-label="Pagination">
              <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} aria-label="Previous page">
                <ArrowLeft aria-hidden="true" />
              </button>
              <span aria-live="polite">{currentPage} / {pageCount}</span>
              <button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount} aria-label="Next page">
                <ArrowRight aria-hidden="true" />
              </button>
            </nav>
          )}
        </div>
      </section>
    </div>
  );
}
