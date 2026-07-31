"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface RouteCandidate {
  path: string;
  label: string;
}

const KNOWN_ROUTES: RouteCandidate[] = [
  { path: "/", label: "Home" },
  { path: "/about", label: "About" },
  { path: "/artists", label: "Artists" },
  { path: "/rescene/artist", label: "RESCENE" },
  { path: "/rescene/discography", label: "Discography" },
  { path: "/rescene/schedule", label: "Schedule" },
  { path: "/notice", label: "Notice" },
  { path: "/audition", label: "Audition" },
  { path: "/protect", label: "Protect" },
  { path: "/contact", label: "Contact" },
];

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
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[lenB][lenA];
}

function findRecommendations(pathname: string): RouteCandidate[] {
  const cleanPath = pathname.toLowerCase().trim();
  const segments = cleanPath.split("/").filter(Boolean);

  const scored = KNOWN_ROUTES.map((route) => {
    const routePath = route.path.toLowerCase();
    let score = 0;

    if (segments.length > 0) {
      for (const seg of segments) {
        if (seg.length > 1 && routePath.includes(seg)) {
          score += 15;
        }
      }
    }

    if (/rescen|resne|rscene|artist/.test(cleanPath) && routePath.includes("rescene")) score += 20;
    if (/disco|album|song|track|music/.test(cleanPath) && routePath.includes("discography")) score += 25;
    if (/sched|calendar|event/.test(cleanPath) && routePath.includes("schedule")) score += 25;
    if (/noti|board|news/.test(cleanPath) && routePath.includes("notice")) score += 20;

    const dist = getLevenshteinDistance(cleanPath, routePath);
    const maxLen = Math.max(cleanPath.length, routePath.length);
    const similarityRatio = maxLen > 0 ? (maxLen - dist) / maxLen : 0;
    score += similarityRatio * 15;

    return { route, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map((item) => item.route);
}

export default function NotFoundClient() {
  const pathname = usePathname();

  // useEffect + useState 대신 useMemo를 사용해 렌더링 과정에서 값을 파생합니다.
  const recommendations = useMemo(() => {
    return pathname ? findRecommendations(pathname) : [];
  }, [pathname]);

  return (
    <main
      style={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px var(--page-gutter, 24px)",
        background: "var(--bg-base)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-sans)",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: "400px", width: "100%" }}>
        {/* Subtle top eyebrow */}
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
            color: "var(--palette-fc6fcf, #fc6fcf)",
            display: "block",
            marginBottom: "16px",
            opacity: 0.9,
          }}
        >
          404 — Page Not Found
        </span>

        {/* Minimal headline */}
        <h1
          style={{
            fontSize: "clamp(24px, 4vw, 32px)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            margin: "0 0 12px",
            color: "var(--text-primary)",
            lineHeight: 1.25,
          }}
        >
          페이지를 찾을 수 없습니다
        </h1>

        <p
          style={{
            fontSize: "14px",
            color: "var(--text-muted)",
            lineHeight: 1.6,
            margin: "0 0 40px",
          }}
        >
          요청하신 주소가 잘못 입력되었거나 변경되었을 수 있습니다.
        </p>

        {/* Minimal Recommendation Links */}
        {recommendations.length > 0 && (
          <div style={{ marginBottom: "40px", textAlign: "left" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-faint, #6b7280)",
                display: "block",
                marginBottom: "12px",
              }}
            >
              Suggested Pages
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {recommendations.map((rec) => (
                <Link
                  key={rec.path}
                  href={rec.path}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    background: "var(--bg-card, rgba(255,255,255,0.03))",
                    border: "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
                    color: "var(--text-primary)",
                    textDecoration: "none",
                    fontSize: "13px",
                    fontWeight: 500,
                    transition: "border-color 150ms ease, background 150ms ease",
                  }}
                >
                  <span>{rec.label}</span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>↗</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Home Link */}
        <Link
          href="/"
          style={{
            display: "inline-block",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.05em",
            color: "var(--text-primary)",
            textDecoration: "none",
            borderBottom: "1px solid var(--palette-fc6fcf, #fc6fcf)",
            paddingBottom: "2px",
            transition: "opacity 150ms ease",
          }}
        >
          Return to Home
        </Link>
      </div>
    </main>
  );
}