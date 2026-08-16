import { redirect } from "next/navigation";
import RetentionAdminPage from "@/admin/pages/retention/page";
import { isAdmin } from "@/core/auth/admin-auth";
import { createPrivatePageMetadata } from "@/core/seo/metadata";
import { createSupabaseServerClient } from "@/core/supabase/server";

export const metadata = createPrivatePageMetadata("Data Retention");

export default async function RetentionPage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = error ? undefined : data?.claims?.sub;
  if (!userId || !(await isAdmin(supabase, userId))) redirect("/admin");
  return <RetentionAdminPage />;
}
