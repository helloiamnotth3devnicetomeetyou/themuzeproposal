"use client";

import { useEffect } from "react";
import { useLocale } from "@/core/providers/LocaleContext";
import styles from "@/styles/(core)/pages/error-state.module.css";

type Locale = "ko" | "en" | "ja";

const copy: Record<
  Locale,
  { eyebrow: string; title: string; description: string; retry: string }
> = {
  ko: {
    eyebrow: "오류",
    title: "문제가 발생했습니다",
    description: "일시적인 오류가 발생했습니다. 다시 시도해 주세요.",
    retry: "다시 시도",
  },
  en: {
    eyebrow: "Error",
    title: "Something went wrong",
    description: "A temporary error occurred. Please try again.",
    retry: "Try again",
  },
  ja: {
    eyebrow: "エラー",
    title: "問題が発生しました",
    description: "一時的なエラーが発生しました。もう一度お試しください。",
    retry: "再試行",
  },
};

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { locale } = useLocale();
  const pageCopy = copy[locale as Locale] || copy.ko;

  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  return (
    <main className={styles.page}>
      <div className={styles.frame}>
        <span className={styles.eyebrow}>{pageCopy.eyebrow}</span>
        <h1 className={styles.title}>{pageCopy.title}</h1>
        <p className={styles.description}>{pageCopy.description}</p>
        <button type="button" onClick={reset} className={styles.resetButton}>
          {pageCopy.retry}
        </button>
      </div>
    </main>
  );
}
