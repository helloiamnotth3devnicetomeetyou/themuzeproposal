"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

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
          Error
        </span>

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
          문제가 발생했습니다
        </h1>

        <p
          style={{
            fontSize: "14px",
            color: "var(--text-muted)",
            lineHeight: 1.6,
            margin: "0 0 40px",
          }}
        >
          일시적인 오류가 발생했습니다. 다시 시도해 주세요.
        </p>

        <button
          onClick={reset}
          style={{
            display: "inline-block",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.05em",
            color: "var(--text-primary)",
            background: "none",
            border: "none",
            borderBottom: "1px solid var(--palette-fc6fcf, #fc6fcf)",
            paddingBottom: "2px",
            cursor: "pointer",
            transition: "opacity 150ms ease",
          }}
        >
          다시 시도
        </button>
      </div>
    </main>
  );
}
