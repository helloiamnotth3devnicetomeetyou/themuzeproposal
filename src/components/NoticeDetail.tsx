"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuArrowLeft } from "react-icons/lu";
import { useLocale } from "@/app/context/LocaleContext";
import LoadingIndicator from "@/components/LoadingIndicator";
import { supabase } from "@/lib/supabase";
import styles from "./NoticeBoard.module.css";

type Locale = "ko" | "en" | "ja";

type Notice = {
  id: string;
  date: string;
  title: { ko: string; en: string; ja: string };
  content: { ko: string; en: string; ja: string };
  category: { ko: string; en: string; ja: string };
};

const copy: Record<Locale, { back: string; loading: string; notFound: string; article: string }> = {
  ko: { back: "공지 목록", loading: "공지를 불러오는 중…", notFound: "공지를 찾을 수 없습니다.", article: "공지 본문" },
  en: { back: "All notices", loading: "Loading notice…", notFound: "Notice not found.", article: "Notice content" },
  ja: { back: "お知らせ一覧", loading: "お知らせを読み込み中…", notFound: "お知らせが見つかりません。", article: "お知らせ本文" },
};

const localized = (value: Notice["title"], locale: Locale) => value[locale] || value.ko || value.en || value.ja;

export default function NoticeDetail({ noticeId, artistSlug }: { noticeId: string; artistSlug?: string }) {
  const { locale: activeLocale } = useLocale();
  const locale = activeLocale as Locale;
  const pageCopy = copy[locale] || copy.ko;
  const [notice, setNotice] = useState<Notice | null>(null);
  const [scopeName, setScopeName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadNotice() {
      setLoading(true);
      setError("");
      let artistId: string | null = null;

      if (artistSlug) {
        const { data: artist, error: artistError } = await supabase.from("artists").select("id,name,eng_name").eq("slug", artistSlug).single();
        if (!active) return;
        if (artistError || !artist) {
          setError(pageCopy.notFound);
          setLoading(false);
          return;
        }
        artistId = artist.id;
        setScopeName(artist.eng_name || artist.name || artistSlug);
      } else {
        setScopeName("");
      }

      let query = supabase
        .from("notices")
        .select("id,title_ko,title_en,title_ja,content_ko,content_en,content_ja,category_ko,category_en,category_ja,date")
        .eq("id", noticeId)
        .eq("is_published", true);
      query = artistId ? query.eq("artist_id", artistId) : query.is("artist_id", null);

      const { data, error: noticeError } = await query.maybeSingle();
      if (!active) return;
      if (noticeError || !data) {
        setError(pageCopy.notFound);
        setLoading(false);
        return;
      }

      setNotice({
        id: data.id,
        date: data.date ?? "",
        title: { ko: data.title_ko ?? "", en: data.title_en ?? "", ja: data.title_ja ?? "" },
        content: { ko: data.content_ko ?? "", en: data.content_en ?? "", ja: data.content_ja ?? "" },
        category: { ko: data.category_ko ?? "", en: data.category_en ?? "", ja: data.category_ja ?? "" },
      });
      setLoading(false);
    }

    void loadNotice();
    return () => { active = false; };
  }, [artistSlug, noticeId, pageCopy.notFound]);

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
              <div className={styles.articleContent} aria-label={pageCopy.article}>{localized(notice.content, locale)}</div>
              <Link href={listHref} className={styles.articleBack}><LuArrowLeft aria-hidden="true" />{pageCopy.back}</Link>
            </article>
          )}
        </div>
      </section>
    </div>
  );
}
