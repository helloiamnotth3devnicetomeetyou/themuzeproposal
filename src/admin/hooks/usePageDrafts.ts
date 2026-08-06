"use client";

import { useSyncExternalStore } from "react";
import type { DraftDiffItem } from "@/admin/utils/draft-diff";

type Entry = { diff: DraftDiffItem[]; commit: () => Promise<void> };
const entries = new Map<string, Entry>();
const listeners = new Set<() => void>();
let version = 0;

const emit = () => { version += 1; listeners.forEach((listener) => listener()); };

export function registerPageDraft(key: string, entry: Entry | null) {
  if (entry) entries.set(key, entry); else entries.delete(key);
  emit();
  return () => { if (entries.delete(key)) emit(); };
}

export function usePageDrafts() {
  useSyncExternalStore((listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; }, () => version, () => 0);
  const current = [...entries.values()];
  return {
    dirty: current.length > 0,
    diff: current.flatMap((entry) => entry.diff),
    // ponytail: client-side batch; replace with one RPC when cross-table atomic rollback is required.
    commit: async () => { for (const entry of current) await entry.commit(); },
  };
}
