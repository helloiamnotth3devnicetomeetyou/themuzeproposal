"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { buildDraftDiff } from "@/admin/utils/draft-diff";
import { isGuideSandboxActive } from "@/core/supabase/guide-sandbox";
import { useAdminDraftKey } from "./useAdminDraftKey";

export function useDraftBackup<T>({
  key,
  draft,
  snapshot,
  dirty,
  restore,
}: {
  key: string | null;
  draft: T | null;
  snapshot: string;
  dirty: boolean;
  restore: (draft: T) => void;
}) {
  const storageKey = useAdminDraftKey(key);
  const [recovery, setRecovery] = useState<{
    draft: T;
    updatedAt: number;
  } | null>(null);
  const diff = useMemo(() => {
    if (!dirty || !draft) return [];
    try {
      return buildDraftDiff(JSON.parse(snapshot || "{}"), draft);
    } catch {
      return [];
    }
  }, [dirty, draft, snapshot]);

  useEffect(() => {
    let active = true;
    if (!snapshot || !storageKey) return;
    if (isGuideSandboxActive()) {
      queueMicrotask(() => {
        if (active) setRecovery(null);
      });
      return () => {
        active = false;
      };
    }
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null") as {
        draft?: T;
        updatedAt?: number;
      } | null;
      const nextRecovery =
        saved?.draft && JSON.stringify(saved.draft) !== snapshot
          ? { draft: saved.draft, updatedAt: saved.updatedAt || Date.now() }
          : null;
      queueMicrotask(() => {
        if (active) setRecovery(nextRecovery);
      });
    } catch {
      localStorage.removeItem(storageKey);
      queueMicrotask(() => {
        if (active) setRecovery(null);
      });
    }
    return () => {
      active = false;
    };
  }, [snapshot, storageKey]);

  useEffect(() => {
    if (!storageKey || !dirty || !draft || recovery || isGuideSandboxActive())
      return;
    const timer = window.setTimeout(
      () =>
        localStorage.setItem(
          storageKey,
          JSON.stringify({ draft, updatedAt: Date.now() }),
        ),
      800,
    );
    return () => clearTimeout(timer);
  }, [dirty, draft, recovery, storageKey]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("admin-draft-dirty", {
        detail: { key: storageKey || key, dirty, diff },
      }),
    );
    return () => {
      window.dispatchEvent(
        new CustomEvent("admin-draft-dirty", {
          detail: { key: storageKey || key, dirty: false },
        }),
      );
    };
  }, [diff, dirty, key, storageKey]);

  useEffect(() => {
    const reset = () => {
      if (storageKey) localStorage.removeItem(storageKey);
      setRecovery(null);
    };
    window.addEventListener("admin-draft-reset", reset);
    return () => window.removeEventListener("admin-draft-reset", reset);
  }, [storageKey]);

  const restoreBackup = useCallback(() => {
    if (recovery) {
      restore(recovery.draft);
      window.dispatchEvent(
        new CustomEvent("admin-toast", { detail: "임시 작업을 복구했습니다." }),
      );
    }
    setRecovery(null);
  }, [recovery, restore]);
  const discardBackup = useCallback(() => {
    if (storageKey) localStorage.removeItem(storageKey);
    setRecovery(null);
  }, [storageKey]);
  return { recovery, restoreBackup, discardBackup };
}
