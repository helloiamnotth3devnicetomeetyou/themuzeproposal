"use client";

import { useEffect, useState } from "react";
import {
  accountScopedDraftKey,
  getCachedAdminDraftAccountId,
  setCachedAdminDraftAccountId,
} from "@/core/auth/admin-drafts";

let accountRequest: Promise<string | null> | null = null;

function loadAccountId() {
  if (!accountRequest) {
    accountRequest = import("@/core/supabase/client")
      .then(({ supabase }) => supabase.auth.getUser())
      .then(({ data: { user } }) => user?.id ?? null)
      .catch(() => null)
      .then((accountId) => {
        setCachedAdminDraftAccountId(accountId);
        return accountId;
      });
  }
  return accountRequest;
}

export function useAdminDraftKey(key?: string | null) {
  const [accountId, setAccountId] = useState<string | null | undefined>(() =>
    key?.startsWith("admin-draft:") ? getCachedAdminDraftAccountId() : null,
  );

  useEffect(() => {
    if (!key?.startsWith("admin-draft:")) return;

    const cached = getCachedAdminDraftAccountId();
    if (cached !== undefined) {
      queueMicrotask(() => setAccountId(cached));
      return;
    }

    let active = true;
    void loadAccountId().then((nextAccountId) => {
      if (active) setAccountId(nextAccountId);
    });
    return () => {
      active = false;
    };
  }, [key]);

  useEffect(() => {
    const refresh = () => {
      accountRequest = null;
      setAccountId(undefined);
      if (key?.startsWith("admin-draft:"))
        void loadAccountId().then(setAccountId);
    };
    window.addEventListener("admin-draft-account-reset", refresh);
    return () =>
      window.removeEventListener("admin-draft-account-reset", refresh);
  }, [key]);

  if (!key || !key.startsWith("admin-draft:")) return key ?? null;
  if (!accountId) return null;
  return accountScopedDraftKey(key, accountId);
}
