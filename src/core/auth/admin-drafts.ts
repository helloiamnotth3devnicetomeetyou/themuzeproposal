export const ADMIN_DRAFT_PREFIX = "admin-draft:";
export const ADMIN_DRAFT_ASSET_REGISTRY_KEY = "themuze:admin-draft-assets";

let cachedAccountId: string | null | undefined;

export function getCachedAdminDraftAccountId() {
  return cachedAccountId;
}

export function setCachedAdminDraftAccountId(accountId: string | null) {
  cachedAccountId = accountId;
}

export function resetCachedAdminDraftAccountId() {
  cachedAccountId = undefined;
}

export function accountScopedDraftKey(key: string, accountId: string) {
  if (!key.startsWith(ADMIN_DRAFT_PREFIX)) return key;
  return `${key}:account:${accountId}`;
}

export function clearAdminDraftStorage() {
  if (typeof window === "undefined") return;

  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(ADMIN_DRAFT_PREFIX))
      window.localStorage.removeItem(key);
  }
  window.localStorage.removeItem(ADMIN_DRAFT_ASSET_REGISTRY_KEY);
  window.dispatchEvent(new Event("admin-draft-reset"));
  resetCachedAdminDraftAccountId();
  window.dispatchEvent(new Event("admin-draft-account-reset"));
}
