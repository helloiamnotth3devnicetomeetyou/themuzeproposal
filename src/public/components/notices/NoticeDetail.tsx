"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale } from "@/core/providers/LocaleContext";
import { usePreviewPayload } from "@/core/preview/PreviewProvider";
import LoadingIndicator from "@/core/components/feedback/LoadingIndicator";
import type { LocalizedTextDTO, NoticeDetailDTO, NoticeNavigationDTO } from "@/public/features/notices/types";
import { sanitizeRichText } from "@/core/utils/rich-text";
import styles from "@/styles/(public)/components/notices/NoticeBoard.module.css";

type Locale = "ko" | "en" | "ja";

const copy: Record<Locale, { back: string; loading: string; notFound: string; article: string; previous: string; next: string; detailNav: string }> = {
  ko: { back: "공지 목록", loading: "공지를 불러오는 중…", notFound: "공지를 찾을 수 없습니다.", article: "공지 본문", previous: "이전 공지", next: "다음 공지", detailNav: "공지 이동" },
  en: { back: "All notices", loading: "Loading notice…", notFound: "Notice not found.", article: "Notice content", previous: "Previous notice", next: "Next notice", detailNav: "Notice navigation" },
  ja: { back: "お知らせ一覧", loading: "お知らせを読み込み中…", notFound: "お知らせが見つかりません。", article: "お知らせ本文", previous: "前のお知らせ", next: "次のお知らせ", detailNav: "お知らせ移動" },
};

const localized = (value: LocalizedTextDTO, locale: Locale) => value[locale] || value.ko || value.en || value.ja;

export default function NoticeDetail({ artistSlug, initialData, initialNavigation, loadFailed = false }: { noticeId: string; artistSlug?: string; initialData: NoticeDetailDTO | null; initialNavigation?: NoticeNavigationDTO | null; loadFailed?: boolean }) {
  const { locale: activeLocale } = useLocale();
  const preview = usePreviewPayload("notice");
  const locale = activeLocale as Locale;
  const pageCopy = copy[locale] || copy.ko;
  const previewData: NoticeDetailDTO | null = preview ? {
    name: preview.scope.name,
    notice: {
      id: preview.notice.id,
      date: preview.notice.date,
      title: preview.notice.title,
      content: preview.notice.content,
      category: preview.notice.category,
    },
  } : null;
  const effectiveData = previewData ?? initialData;
  const notice = effectiveData?.notice ?? null;
  const scopeName = effectiveData?.name ?? "";
  const loading = false;
  const error = (!preview && loadFailed) || !notice ? pageCopy.notFound : "";
  const heading = scopeName ? `${scopeName.toUpperCase()} NOTICE` : "NOTICE";
  const listHref = artistSlug ? `/${artistSlug}/notice` : "/notice";
  const detailHref = (id: string) => artistSlug ? `/${artistSlug}/notice/${id}` : `/notice/${id}`;

  return (
    <div className={styles.pageFrame}>
      <section className={`${styles.board} ${styles.detailBoard}`} aria-labelledby="notice-detail-title">
        <header className={styles.titleColumn}>
          <div className={styles.titleSticky}>
            <p className={styles.detailEyebrow}>{heading}</p>
            <Link href={listHref} className={styles.backLink}><ArrowLeft aria-hidden="true" />{pageCopy.back}</Link>
            {!preview && initialNavigation && <nav className={styles.detailNavigation} aria-label={pageCopy.detailNav}>
              {initialNavigation.previous && <Link href={detailHref(initialNavigation.previous.id)}><span>{pageCopy.previous}<ArrowLeft aria-hidden="true" /></span><b>{localized(initialNavigation.previous.title, locale)}</b></Link>}
              {initialNavigation.next && <Link href={detailHref(initialNavigation.next.id)}><span>{pageCopy.next}<ArrowRight aria-hidden="true" /></span><b>{localized(initialNavigation.next.title, locale)}</b></Link>}
            </nav>}
          </div>
        </header>

        <div className={`${styles.listColumn} ${styles.articleColumn}`}>
          {loading && <LoadingIndicator label={pageCopy.loading} className="min-h-[500px]" />}
          {!loading && error && <div className={`${styles.state} ${styles.error}`} role="alert"><b>!</b><p>{error}</p><Link href={listHref}>{pageCopy.back}</Link></div>}
          {!loading && notice && (
            <article className={styles.article}>
              <div className={styles.articleMeta}>
                <span>{localized(notice.category, locale)}</span>
                <time dateTime={notice.date}>{notice.date || "—"}</time>
              </div>
              <h1 id="notice-detail-title">{localized(notice.title, locale)}</h1>
              <div className={styles.articleRule} />
              <div
                className={styles.articleContent}
                aria-label={pageCopy.article}
                dangerouslySetInnerHTML={{ __html: sanitizeRichText(localized(notice.content, locale)) }}
              />
              <Link href={listHref} className={styles.articleBack}><ArrowLeft aria-hidden="true" />{pageCopy.back}</Link>
            </article>
          )}
        </div>
      </section>
    </div>
  );
}
