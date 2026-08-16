import type { SupabaseClient } from "@supabase/supabase-js";
import type { UploadedImageAsset } from "@/admin/components/assets/ImageAssetField";
import { deleteAdminAssets } from "@/admin/utils/delete-admin-assets";
import { managedAssetFromUrl } from "@/core/storage/public-url";

function managedPathFromUrl(value: string): string | null {
  if (!value) return null;
  const asset = managedAssetFromUrl(value);
  return asset && asset.bucket === "artist-assets" ? asset.path : null;
}

async function removePaths(client: SupabaseClient, paths: string[]) {
  const unique = [...new Set(paths.filter(Boolean))];
  void client;
  if (unique.length) await deleteAdminAssets("artist-assets", unique);
}

const DRAFT_ASSET_REGISTRY_KEY = "themuze:admin-draft-assets";
const ABANDONED_ASSET_AGE_MS = 30 * 60 * 1000;

type RegisteredDraftAsset = UploadedImageAsset & { createdAt: number };

function isRegisteredDraftAsset(
  value: unknown,
): value is RegisteredDraftAsset {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const asset = value as Record<string, unknown>;
  return (
    asset.bucket === "artist-assets" &&
    typeof asset.path === "string" &&
    asset.path.length > 0 &&
    typeof asset.url === "string" &&
    asset.url.length > 0 &&
    typeof asset.createdAt === "number" &&
    Number.isFinite(asset.createdAt) &&
    asset.createdAt >= 0
  );
}

function readRegistry(): RegisteredDraftAsset[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(DRAFT_ASSET_REGISTRY_KEY);
    if (!stored) return [];
    let parsed: unknown;
    try {
      parsed = JSON.parse(stored);
    } catch {
      window.localStorage.removeItem(DRAFT_ASSET_REGISTRY_KEY);
      return [];
    }
    if (!Array.isArray(parsed) || !parsed.every(isRegisteredDraftAsset)) {
      window.localStorage.removeItem(DRAFT_ASSET_REGISTRY_KEY);
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

function referencedDraftPaths(registry: RegisteredDraftAsset[]) {
  if (typeof window === "undefined") return new Set<string>();
  const drafts = Object.keys(localStorage)
    .filter((key) => key.startsWith("admin-draft:"))
    .map((key) => localStorage.getItem(key) || "")
    .join("\n");
  return new Set(
    registry
      .filter(
        (asset) => drafts.includes(asset.url) || drafts.includes(asset.path),
      )
      .map((asset) => asset.path),
  );
}

function writeRegistry(items: RegisteredDraftAsset[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      DRAFT_ASSET_REGISTRY_KEY,
      JSON.stringify(items),
    );
  } catch {
    // Cleanup is best-effort when browser storage is unavailable.
  }
}

function untrackDraftImageAssets(assets: UploadedImageAsset[]) {
  const paths = new Set(assets.map((asset) => asset.path));
  if (!paths.size) return;
  writeRegistry(readRegistry().filter((asset) => !paths.has(asset.path)));
}

export function trackDraftImageAsset(asset: UploadedImageAsset) {
  const registry = readRegistry().filter((item) => item.path !== asset.path);
  registry.push({ ...asset, createdAt: Date.now() });
  writeRegistry(registry);
}

export async function cleanupAbandonedDraftImageAssets(client: SupabaseClient) {
  const cutoff = Date.now() - ABANDONED_ASSET_AGE_MS;
  const registry = readRegistry();
  const referenced = referencedDraftPaths(registry);
  const abandoned = registry.filter(
    (asset) => asset.createdAt < cutoff && !referenced.has(asset.path),
  );
  if (!abandoned.length) return;
  await removePaths(
    client,
    abandoned.map((asset) => asset.path),
  );
  untrackDraftImageAssets(abandoned);
}

export async function discardDraftImageAssets(
  client: SupabaseClient,
  queued: UploadedImageAsset[],
) {
  await removePaths(
    client,
    queued.map((asset) => asset.path),
  );
  untrackDraftImageAssets(queued);
}

export async function finalizeDraftImageAssets(
  client: SupabaseClient,
  queued: UploadedImageAsset[],
  referencedUrls: string[],
  originalUrls: string[],
) {
  const referenced = new Set(referencedUrls.filter(Boolean));
  const queuedToDelete = queued
    .filter((asset) => !referenced.has(asset.url))
    .map((asset) => asset.path);
  const replacedOriginals = originalUrls
    .filter((url) => url && !referenced.has(url))
    .map(managedPathFromUrl)
    .filter((path): path is string => Boolean(path));
  await removePaths(client, [...queuedToDelete, ...replacedOriginals]);
  untrackDraftImageAssets(queued);
}
