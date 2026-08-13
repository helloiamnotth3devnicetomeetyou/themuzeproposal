import { guideSandboxFetch } from "@/core/supabase/guide-sandbox";
import { managedAssetFromUrl } from "@/core/storage/public-url";

export async function deleteAdminAssets(bucket: string, paths: string[]) {
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  if (!uniquePaths.length) return true;
  const response = await guideSandboxFetch("/api/uploads/admin-asset", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucket, paths: uniquePaths }),
  });
  return response.ok;
}

export async function deleteAdminAssetUrls(urls: string[]) {
  const grouped = new Map<string, string[]>();
  for (const url of urls) {
    const asset = managedAssetFromUrl(url);
    if (!asset) continue;
    grouped.set(asset.bucket, [...(grouped.get(asset.bucket) ?? []), asset.path]);
  }
  await Promise.all([...grouped].map(([bucket, paths]) => deleteAdminAssets(bucket, paths)));
}
