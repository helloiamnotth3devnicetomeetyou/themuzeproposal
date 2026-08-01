"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  parsePreviewEnvelope,
  PREVIEW_TTL_MS,
  previewStorageKey,
  type PreviewEnvelope,
  type PreviewKind,
  type PreviewPayloadByKind,
} from "./types";

type PreviewContextValue = {
  active: boolean;
  envelope: PreviewEnvelope | null;
};

const PreviewContext = createContext<PreviewContextValue>({
  active: false,
  envelope: null,
});

export function PreviewProvider({
  draftModeEnabled,
  children,
}: {
  draftModeEnabled: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);
  const previewRequested = draftModeEnabled && Boolean(token);
  const [envelope, setEnvelope] = useState<PreviewEnvelope | null>(null);
  const [resolved, setResolved] = useState(!previewRequested);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("preview"));
  }, []);

  const readEnvelope = useCallback(() => {
    if (!previewRequested || !token) {
      setEnvelope(null);
      setResolved(true);
      return;
    }
    try {
      const key = previewStorageKey(token);
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? parsePreviewEnvelope(raw, token) : null;
      if (parsed) {
        const refreshed = { ...parsed, expiresAt: Date.now() + PREVIEW_TTL_MS };
        window.localStorage.setItem(key, JSON.stringify(refreshed));
        setEnvelope(refreshed);
      } else {
        setEnvelope(null);
      }
    } catch {
      setEnvelope(null);
    }
    setResolved(true);
  }, [previewRequested, token]);

  useEffect(() => {
    const timer = window.setTimeout(readEnvelope, 0);
    return () => window.clearTimeout(timer);
  }, [readEnvelope]);

  useEffect(() => {
    if (!previewRequested || !token) return;
    const key = previewStorageKey(token);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key) return;
      setEnvelope(event.newValue ? parsePreviewEnvelope(event.newValue, token) : null);
      setResolved(true);
    };
    window.addEventListener("storage", onStorage);
    const expiryTimer = window.setInterval(readEnvelope, 30_000);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.clearInterval(expiryTimer);
    };
  }, [previewRequested, readEnvelope, token]);

  useEffect(() => {
    if (!envelope || !token) return;
    const target = new URL(envelope.targetPath, window.location.origin);
    target.searchParams.set("preview", token);
    const next = `${target.pathname}${target.search}${target.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next !== current) router.replace(next, { scroll: false });
  }, [envelope, pathname, router, token]);

  const exitPreview = async () => {
    if (token) {
      try {
        window.localStorage.removeItem(previewStorageKey(token));
      } catch {
        // The server-side cookie can still be cleared when storage is unavailable.
      }
    }
    await fetch("/api/admin/preview/exit", { method: "POST" });
    const target = new URL(window.location.href);
    target.searchParams.delete("preview");
    window.location.assign(`${target.pathname}${target.search}${target.hash}`);
  };

  const contextValue = useMemo<PreviewContextValue>(
    () => ({ active: previewRequested && Boolean(envelope), envelope }),
    [envelope, previewRequested],
  );

  if (previewRequested && !resolved) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--bg-base)] px-6 text-center">
        <p className="text-sm font-semibold text-[var(--text-muted)]">미리보기 초안을 불러오는 중입니다.</p>
      </main>
    );
  }

  if (previewRequested && !envelope) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--bg-base)] px-6 text-center">
        <div className="max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-8">
          <h1 className="text-xl font-black text-[var(--text-primary)]">미리보기 데이터를 찾을 수 없습니다.</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">초안이 만료되었거나 이 브라우저에서 생성되지 않았습니다. 관리자 화면에서 미리보기를 다시 열어주세요.</p>
          <button type="button" onClick={() => void exitPreview()} className="mt-6 rounded-full bg-brand-pink px-5 py-3 text-sm font-black text-black">
            미리보기 종료
          </button>
        </div>
      </main>
    );
  }

  return (
    <PreviewContext.Provider value={contextValue}>
      {children}
      {previewRequested && (
        <aside className="fixed inset-x-0 bottom-4 z-[9999] mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-3 rounded-full border border-white/15 bg-black/90 px-4 py-2 text-xs font-bold text-white shadow-2xl backdrop-blur" role="status">
          <span className="size-2 animate-pulse rounded-full bg-brand-pink" aria-hidden="true" />
          <span>관리자 미리보기 · 실시간 반영 중</span>
          <button type="button" onClick={() => void exitPreview()} className="rounded-full bg-white/10 px-3 py-1.5 transition-colors hover:bg-white/20">
            종료
          </button>
        </aside>
      )}
    </PreviewContext.Provider>
  );
}

export function usePreviewPayload<K extends PreviewKind>(kind: K): PreviewPayloadByKind[K] | null {
  const { active, envelope } = useContext(PreviewContext);
  if (!active || !envelope || envelope.kind !== kind) return null;
  return envelope.payload as PreviewPayloadByKind[K];
}
