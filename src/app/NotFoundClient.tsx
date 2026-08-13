"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/core/providers/LocaleContext";
import styles from "@/styles/(core)/pages/error-state.module.css";

interface RouteCandidate {
  path: string;
  label: string;
}

type Locale = "ko" | "en" | "ja";

const copy: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    description: string;
    suggested: string;
    home: string;
  }
> = {
  ko: {
    eyebrow: "404 — 페이지를 찾을 수 없습니다",
    title: "페이지를 찾을 수 없습니다",
    description: "요청하신 주소가 잘못 입력되었거나 변경되었을 수 있습니다.",
    suggested: "추천 페이지",
    home: "홈으로 돌아가기",
  },
  en: {
    eyebrow: "404 — Page Not Found",
    title: "Page not found",
    description: "The address you requested may be mistyped or have changed.",
    suggested: "Suggested pages",
    home: "Return to home",
  },
  ja: {
    eyebrow: "404 — ページが見つかりません",
    title: "ページが見つかりません",
    description:
      "アクセスされたアドレスが誤っているか、変更された可能性があります。",
    suggested: "おすすめのページ",
    home: "ホームに戻る",
  },
};

function getLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  const lenA = a.length;
  const lenB = b.length;

  for (let i = 0; i <= lenB; i++) matrix[i] = [i];
  for (let j = 0; j <= lenA; j++) matrix[0][j] = j;

  for (let i = 1; i <= lenB; i++) {
    for (let j = 1; j <= lenA; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[lenB][lenA];
}

function findRecommendations(
  pathname: string,
  routes: RouteCandidate[],
): RouteCandidate[] {
  const cleanPath = pathname.toLowerCase().trim();
  const segments = cleanPath.split("/").filter(Boolean);

  const scored = routes.map((route) => {
    const routePath = route.path.toLowerCase();
    let score = 0;

    if (segments.length > 0) {
      for (const seg of segments) {
        if (seg.length > 1 && routePath.includes(seg)) {
          score += 15;
        }
      }
    }

    if (
      /disco|album|song|track|music/.test(cleanPath) &&
      routePath.includes("discography")
    )
      score += 25;
    if (
      /sched|calendar|event/.test(cleanPath) &&
      routePath.includes("schedule")
    )
      score += 25;
    if (/noti|board|news/.test(cleanPath) && routePath.includes("notice"))
      score += 20;
    if (/artist|member/.test(cleanPath) && routePath.includes("artist"))
      score += 20;

    const dist = getLevenshteinDistance(cleanPath, routePath);
    const maxLen = Math.max(cleanPath.length, routePath.length);
    const similarityRatio = maxLen > 0 ? (maxLen - dist) / maxLen : 0;
    score += similarityRatio * 15;

    return { route, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map((item) => item.route);
}

export default function NotFoundClient({
  routes,
}: {
  routes: RouteCandidate[];
}) {
  const pathname = usePathname();
  const { locale } = useLocale();
  const pageCopy = copy[locale as Locale] || copy.ko;

  const recommendations = useMemo(() => {
    return pathname ? findRecommendations(pathname, routes) : [];
  }, [pathname, routes]);

  return (
    <main className={styles.page}>
      <div className={styles.frame}>
        <span className={styles.eyebrow}>{pageCopy.eyebrow}</span>
        <h1 className={styles.title}>{pageCopy.title}</h1>
        <p className={styles.description}>{pageCopy.description}</p>

        {recommendations.length > 0 && (
          <div className={styles.recommendations}>
            <span className={styles.recommendationsLabel}>
              {pageCopy.suggested}
            </span>
            <div className={styles.recommendationList}>
              {recommendations.map((rec) => (
                <Link
                  key={rec.path}
                  href={rec.path}
                  className={styles.recommendationLink}
                >
                  <span>{rec.label}</span>
                  <span
                    className={styles.recommendationArrow}
                    aria-hidden="true"
                  >
                    ↗
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <Link href="/" className={styles.homeLink}>
          {pageCopy.home}
        </Link>
      </div>
    </main>
  );
}
