"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

export interface UseAdminCrudOptions<T> {
  initialDraft: T | null;
}

export function useAdminCrud<T>({
  initialDraft,
}: UseAdminCrudOptions<T>) {
  const [draft, setDraft] = useState<T | null>(initialDraft);
  const [snapshot, setSnapshot] = useState<string>(initialDraft ? JSON.stringify(initialDraft) : "");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const serializedDraft = useMemo(() => draft ? JSON.stringify(draft) : "", [draft]);
  const dirty = useMemo(() => {
    if (!draft) return false;
    return serializedDraft !== snapshot;
  }, [draft, serializedDraft, snapshot]);

  const patchDraft = useCallback((patch: Partial<T> | ((curr: T) => T)) => {
    setDraft((current) => {
      if (!current) return null;
      if (typeof patch === "function") {
        return patch(current);
      }
      return { ...current, ...patch };
    });
  }, []);

  const resetDraft = useCallback((nextDraft: T | null) => {
    setDraft(nextDraft);
    setSnapshot(nextDraft ? JSON.stringify(nextDraft) : "");
    setError("");
  }, []);

  // auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  // beforeunload warning
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
  };
}
