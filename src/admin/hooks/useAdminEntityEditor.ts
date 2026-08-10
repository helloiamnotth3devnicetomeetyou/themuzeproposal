"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { buildDraftDiff } from "@/admin/utils/draft-diff";
import { isGuideSandboxActive } from "@/core/supabase/guide-sandbox";

type EditorOperation = "loading" | "saving" | "deleting";

export interface UseAdminEntityEditorOptions<T> {
  initialDraft: T | null;
  serialize?: (draft: T) => string;
  storageKey?: string;
}

export interface RunEditorOperationOptions {
  clearError?: boolean;
  errorMessage?: string | ((error: unknown) => string);
}

const defaultSerialize = <T,>(draft: T) => JSON.stringify(draft);

const defaultErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "요청을 처리하지 못했습니다.";

export function useAdminEntityEditor<T>({
  initialDraft,
  serialize = defaultSerialize,
  storageKey,
}: UseAdminEntityEditorOptions<T>) {
  const [draft, setDraft] = useState<T | null>(initialDraft);
  const [snapshot, setSnapshot] = useState(initialDraft ? serialize(initialDraft) : "");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [recovery, setRecovery] = useState<{ draft: T; updatedAt: number } | null>(null);

  const serializedDraft = useMemo(
    () => (draft ? serialize(draft) : ""),
    [draft, serialize],
  );
  const dirty = Boolean(draft) && serializedDraft !== snapshot;
  const diff = useMemo(() => {
    if (!dirty || !draft) return [];
    try { return buildDraftDiff(JSON.parse(snapshot || "{}"), draft); } catch { return []; }
  }, [dirty, draft, snapshot]);

  const patchDraft = useCallback((patch: Partial<T> | ((current: T) => T)) => {
    setDraft((current) => {
      if (!current) return null;
      return typeof patch === "function" ? patch(current) : { ...current, ...patch };
    });
  }, []);

  const resetDraft = useCallback((nextDraft: T | null) => {
    setDraft(nextDraft);
    setSnapshot(nextDraft ? serialize(nextDraft) : "");
    setError("");
  }, [serialize]);

  const commitDraft = useCallback((nextDraft?: T | null) => {
    if (nextDraft !== undefined) {
      setDraft(nextDraft);
      setSnapshot(nextDraft ? serialize(nextDraft) : "");
      if (storageKey) window.localStorage.removeItem(storageKey);
      return;
    }
    setSnapshot(serializedDraft);
    if (storageKey) window.localStorage.removeItem(storageKey);
  }, [serialize, serializedDraft, storageKey]);

  const restoreDraft = useCallback(() => {
    if (!recovery) return;
    setDraft(recovery.draft);
    setRecovery(null);
  }, [recovery]);

  const discardDraftBackup = useCallback(() => {
    if (storageKey) window.localStorage.removeItem(storageKey);
    setRecovery(null);
  }, [storageKey]);

  const runOperation = useCallback(async <R,>(
    operation: EditorOperation,
    task: () => Promise<R>,
    options: RunEditorOperationOptions = {},
  ): Promise<R | undefined> => {
    const setBusy = operation === "loading"
      ? setLoading
      : operation === "saving"
        ? setSaving
        : setDeleting;

    if (options.clearError !== false) setError("");
    setBusy(true);
    try {
      return await task();
    } catch (operationError) {
      const message = typeof options.errorMessage === "function"
        ? options.errorMessage(operationError)
        : options.errorMessage || defaultErrorMessage(operationError);
      setError(message);
      return undefined;
    } finally {
      setBusy(false);
    }
  }, []);

  const runLoad = useCallback(
    <R,>(task: () => Promise<R>, options?: RunEditorOperationOptions) =>
      runOperation("loading", task, options),
    [runOperation],
  );
  const runSave = useCallback(
    <R,>(task: () => Promise<R>, options?: RunEditorOperationOptions) =>
      runOperation("saving", task, options),
    [runOperation],
  );
  const runDelete = useCallback(
    <R,>(task: () => Promise<R>, options?: RunEditorOperationOptions) =>
      runOperation("deleting", task, options),
    [runOperation],
  );

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let resetting = false;
    const reset = () => {
      resetting = true;
      if (storageKey) window.localStorage.removeItem(storageKey);
      setRecovery(null);
    };
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty && !resetting) event.preventDefault();
    };
    window.addEventListener("admin-draft-reset", reset);
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("admin-draft-reset", reset);
      window.removeEventListener("beforeunload", warn);
    };
  }, [dirty, storageKey]);

  useEffect(() => {
    let active = true;
    if (!storageKey || !snapshot) return;
    if (isGuideSandboxActive()) {
      queueMicrotask(() => { if (active) setRecovery(null); });
      return () => { active = false; };
    }
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) || "null") as { draft?: T; updatedAt?: number } | null;
      if (saved?.draft && serialize(saved.draft) !== snapshot) queueMicrotask(() => { if (active) setRecovery({ draft: saved.draft!, updatedAt: saved.updatedAt || Date.now() }); });
    } catch { window.localStorage.removeItem(storageKey); }
    return () => { active = false; };
  }, [serialize, snapshot, storageKey]);

  useEffect(() => {
    if (!storageKey || !dirty || !draft || recovery || isGuideSandboxActive()) return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(storageKey, JSON.stringify({ draft, updatedAt: Date.now() }));
    }, 800);
    return () => window.clearTimeout(timer);
  }, [dirty, draft, recovery, storageKey]);

  useEffect(() => {
    const key = storageKey || `editor-${Math.random()}`;
    window.dispatchEvent(new CustomEvent("admin-draft-dirty", { detail: { key, dirty, diff } }));
    return () => { window.dispatchEvent(new CustomEvent("admin-draft-dirty", { detail: { key, dirty: false } })); };
  }, [diff, dirty, storageKey]);

  return {
    draft,
    setDraft,
    snapshot,
    setSnapshot,
    serializedDraft,
    dirty,
    loading,
    setLoading,
    saving,
    setSaving,
    deleting,
    setDeleting,
    deleteOpen,
    setDeleteOpen,
    error,
    setError,
    toast,
    setToast,
    patchDraft,
    resetDraft,
    commitDraft,
    runLoad,
    runSave,
    runDelete,
    recovery,
    restoreDraft,
    discardDraftBackup,
  };
}
