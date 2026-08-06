"use client";

import { useCallback, useEffect, useState } from "react";

export function useDraftBackup<T>({ key, draft, snapshot, dirty, restore }: { key: string; draft: T | null; snapshot: string; dirty: boolean; restore: (draft: T) => void }) {
  const [recovery, setRecovery] = useState<{ draft: T; updatedAt: number } | null>(null);

  useEffect(() => {
    let active = true;
    if (!snapshot) return;
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "null") as { draft?: T; updatedAt?: number } | null;
      const nextRecovery = saved?.draft && JSON.stringify(saved.draft) !== snapshot
        ? { draft: saved.draft, updatedAt: saved.updatedAt || Date.now() }
        : null;
      queueMicrotask(() => { if (active) setRecovery(nextRecovery); });
    } catch {
      localStorage.removeItem(key);
      queueMicrotask(() => { if (active) setRecovery(null); });
    }
    return () => { active = false; };
  }, [key, snapshot]);

  useEffect(() => {
    if (!dirty || !draft || recovery) return;
    const timer = window.setTimeout(() => localStorage.setItem(key, JSON.stringify({ draft, updatedAt: Date.now() })), 800);
    return () => clearTimeout(timer);
  }, [dirty, draft, key, recovery]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("admin-draft-dirty", { detail: { key, dirty } }));
    return () => { window.dispatchEvent(new CustomEvent("admin-draft-dirty", { detail: { key, dirty: false } })); };
  }, [dirty, key]);

  const restoreBackup = useCallback(() => { if (recovery) { restore(recovery.draft); window.dispatchEvent(new CustomEvent("admin-toast", { detail: "임시 작업을 복구했습니다." })); } setRecovery(null); }, [recovery, restore]);
  const discardBackup = useCallback(() => { localStorage.removeItem(key); setRecovery(null); }, [key]);
  return { recovery, restoreBackup, discardBackup };
}
