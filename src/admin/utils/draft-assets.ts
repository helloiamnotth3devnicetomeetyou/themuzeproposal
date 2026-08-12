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

function readRegistry(): RegisteredDraftAsset[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(DRAFT_ASSET_REGISTRY_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is RegisteredDraftAsset =>
      Boolean(item)
      && typeof item === "object"
      && (item as RegisteredDraftAsset).bucket === "artist-assets"
      && typeof (item as RegisteredDraftAsset).path === "string"
      && typeof (item as RegisteredDraftAsset).url === "string"
      && typeof (item as RegisteredDraftAsset).createdAt === "number");
  } catch {
    return [];
  }
}

function writeRegistry(items: RegisteredDraftAsset[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_ASSET_REGISTRY_KEY, JSON.stringify(items));
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
  const abandoned = registry.filter((asset) => asset.createdAt < cutoff);
  if (!abandoned.length) return;
  await removePaths(client, abandoned.map((asset) => asset.path));
  untrackDraftImageAssets(abandoned);
}

export async function discardDraftImageAssets(
  client: SupabaseClient,
  queued: UploadedImageAsset[],
) {
  await removePaths(client, queued.map((asset) => asset.path));
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
