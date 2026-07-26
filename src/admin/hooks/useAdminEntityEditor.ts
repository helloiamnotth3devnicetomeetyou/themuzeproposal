"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type EditorOperation = "loading" | "saving" | "deleting";

export interface UseAdminEntityEditorOptions<T> {
  initialDraft: T | null;
  serialize?: (draft: T) => string;
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
}: UseAdminEntityEditorOptions<T>) {
  const [draft, setDraft] = useState<T | null>(initialDraft);
  const [snapshot, setSnapshot] = useState(initialDraft ? serialize(initialDraft) : "");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const serializedDraft = useMemo(
    () => (draft ? serialize(draft) : ""),
    [draft, serialize],
  );
  const dirty = Boolean(draft) && serializedDraft !== snapshot;

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
      return;
    }
    setSnapshot(serializedDraft);
  }, [serialize, serializedDraft]);

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
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

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
  };
}
