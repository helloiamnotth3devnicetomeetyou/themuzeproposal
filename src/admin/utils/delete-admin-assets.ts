import { guideSandboxFetch } from "@/core/supabase/guide-sandbox";

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
