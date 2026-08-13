import { redirect } from "next/navigation";
import SettingsAdmin from "@/admin/pages/settings/page";
import { isSuperAdmin } from "@/core/auth/admin-auth";
import { createPrivatePageMetadata } from "@/core/seo/metadata";
import { createSupabaseServerClient } from "@/core/supabase/server";

export const metadata = createPrivatePageMetadata("Site Settings");

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = error ? undefined : data?.claims?.sub;
  const canManageAdminAccounts = Boolean(
    userId && (await isSuperAdmin(supabase, userId)),
  );
  if (params.tab === "admins" && !canManageAdminAccounts)
    redirect("/admin/settings");

  return <SettingsAdmin canManageAdminAccounts={canManageAdminAccounts} />;
}
