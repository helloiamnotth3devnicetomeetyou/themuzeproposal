"use client";

import Link from "next/link";
import { LuArrowLeft } from "react-icons/lu";
import { useLocale } from "@/core/providers/LocaleContext";
import { usePreviewPayload } from "@/core/preview/PreviewProvider";
import LoadingIndicator from "@/core/components/feedback/LoadingIndicator";
import type { LocalizedTextDTO, NoticeDetailDTO } from "@/public/features/notices/types";
import { sanitizeRichText } from "@/core/utils/rich-text";
import styles from "@/styles/(public)/components/notices/NoticeBoard.module.css";

type Locale = "ko" | "en" | "ja";

const copy: Record<Locale, { back: string; loading: string; notFound: string; article: string }> = {
  ko: { back: "공지 목록", loading: "공지를 불러오는 중…", notFound: "공지를 찾을 수 없습니다.", article: "공지 본문" },
  en: { back: "All notices", loading: "Loading notice…", notFound: "Notice not found.", article: "Notice content" },
  ja: { back: "お知らせ一覧", loading: "お知らせを読み込み中…", notFound: "お知らせが見つかりません。", article: "お知らせ本文" },
};

const localized = (value: LocalizedTextDTO, locale: Locale) => value[locale] || value.ko || value.en || value.ja;

export default function NoticeDetail({ artistSlug, initialData, loadFailed = false }: { noticeId: string; artistSlug?: string; initialData: NoticeDetailDTO | null; loadFailed?: boolean }) {
  const { locale: activeLocale } = useLocale();
  const preview = usePreviewPayload("notice");
  const locale = activeLocale as Locale;
  const pageCopy = copy[locale] || copy.ko;
  const previewData: NoticeDetailDTO | null = preview ? {
    name: preview.scope.name,
    notice: {
      id: preview.notice.id,
      date: preview.notice.date,
      title: { ko: preview.notice.title, en: "", ja: "" },
      content: { ko: preview.notice.content, en: "", ja: "" },
      category: { ko: preview.notice.category, en: "", ja: "" },
    },
  } : null;
  const effectiveData = previewData ?? initialData;
  const notice = effectiveData?.notice ?? null;
  const scopeName = effectiveData?.name ?? "";
  const loading = false;
  const error = (!preview && loadFailed) || !notice ? pageCopy.notFound : "";
  const heading = scopeName ? `${scopeName.toUpperCase()} NOTICE` : "NOTICE";
  const listHref = artistSlug ? `/${artistSlug}/notice` : "/notice";

  return (
    <div className={styles.pageFrame}>
      <section className={`${styles.board} ${styles.detailBoard}`} aria-labelledby="notice-detail-title">
        <header className={styles.titleColumn}>
          <div className={styles.titleSticky}>
            <p className={styles.detailEyebrow}>{heading}</p>
            <Link href={listHref} className={styles.backLink}><LuArrowLeft aria-hidden="true" />{pageCopy.back}</Link>
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
              <Link href={listHref} className={styles.articleBack}><LuArrowLeft aria-hidden="true" />{pageCopy.back}</Link>
            </article>
          )}
        </div>
      </section>
    </div>
  );
}
