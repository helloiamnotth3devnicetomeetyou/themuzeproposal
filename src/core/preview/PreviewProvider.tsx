"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  parsePreviewEnvelope,
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

const subscribeToLocation = () => () => {};
const getServerPreviewToken = () => null;
const getPreviewToken = () => new URLSearchParams(window.location.search).get("preview");

export function PreviewProvider({
  draftModeEnabled,
  children,
}: {
  draftModeEnabled: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useSyncExternalStore(subscribeToLocation, getPreviewToken, getServerPreviewToken);
  const previewRequested = draftModeEnabled && Boolean(token);
  const [envelope, setEnvelope] = useState<PreviewEnvelope | null>(null);
  const [resolved, setResolved] = useState(!previewRequested);

  useEffect(() => {
    const timer = window.setTimeout(() => setResolved(!previewRequested), 0);
    return () => window.clearTimeout(timer);
  }, [previewRequested, token]);

  const readEnvelope = useCallback(async () => {
    if (!previewRequested || !token) {
      setEnvelope(null);
      setResolved(true);
      return;
    }
    try {
      const validation = await fetch(`/api/admin/preview/validate?token=${encodeURIComponent(token)}`, { cache: "no-store" });
      if (!validation.ok) {
        setEnvelope(null);
        return;
      }
      const key = previewStorageKey(token);
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? parsePreviewEnvelope(raw, token) : null;
      if (parsed) {
        setEnvelope(parsed);
      } else {
        setEnvelope(null);
      }
    } catch {
      setEnvelope(null);
    } finally {
      setResolved(true);
    }
  }, [previewRequested, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => void readEnvelope(), 0);
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
    const expiryTimer = window.setInterval(() => void readEnvelope(), 30_000);
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
    if (next !== current && !window.location.pathname.startsWith(`${target.pathname}/`)) router.replace(next, { scroll: false });
  }, [envelope, pathname, router, token]);

  const previewLabel = useMemo(() => {
    if (!envelope) return "";
    if (envelope.kind === "artist-profile") return `아티스트 프로필 · ${envelope.payload.artist.name}`;
    if (envelope.kind === "artist-member") return `멤버 프로필 · ${envelope.payload.member.name}`;
    if (envelope.kind === "album") return `앨범 · ${envelope.payload.album.title}`;
    if (envelope.kind === "notice") return `공지 · ${envelope.payload.notice.title.ko}`;
    if (envelope.kind === "schedule") return `일정 · ${envelope.payload.schedule.title_ko}`;
    return "사이트 설정";
  }, [envelope]);

  useEffect(() => {
    if (!envelope) return;
    const target = new URL(envelope.targetPath, window.location.origin);
    const confirmLeaving = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank") return;
      const destination = new URL(anchor.href, window.location.href);
      const staysInPreview = destination.origin === target.origin
        && (destination.pathname === target.pathname || destination.pathname.startsWith(`${target.pathname}/`));
      if (!staysInPreview && !window.confirm(`${previewLabel} 미리보기를 벗어납니다. 계속할까요?`)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("click", confirmLeaving, true);
    return () => document.removeEventListener("click", confirmLeaving, true);
  }, [envelope, previewLabel]);

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
        <>
          <div className="pointer-events-none fixed inset-0 z-[9998] border-[3px] border-brand-pink" aria-hidden="true" />
          <aside className="fixed inset-x-0 bottom-4 z-[9999] mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-3 rounded-full border border-white/15 bg-black/90 px-4 py-2 text-white shadow-2xl backdrop-blur" role="status">
            <span className="size-2 shrink-0 animate-pulse rounded-full bg-brand-pink" aria-hidden="true" />
            <span className="flex min-w-0 flex-col">
              <strong className="truncate text-xs">{previewLabel}</strong>
              <small className="text-[10px] font-bold text-white/60">관리자 미리보기 · 실시간 반영 중</small>
            </span>
            <button type="button" onClick={() => void exitPreview()} className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold transition-colors hover:bg-white/20">
              종료
            </button>
          </aside>
        </>
      )}
    </PreviewContext.Provider>
  );
}

export function usePreviewPayload<K extends PreviewKind>(kind: K): PreviewPayloadByKind[K] | null {
  const { active, envelope } = useContext(PreviewContext);
  if (!active || !envelope || envelope.kind !== kind) return null;
  return envelope.payload as PreviewPayloadByKind[K];
}
