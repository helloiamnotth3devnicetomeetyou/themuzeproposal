import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminShell from "@/admin/components/shell/AdminShell";
import { isAdmin } from "@/core/auth/admin-auth";
import { createSupabaseServerClient } from "@/core/supabase/server";
import "@/admin/styles/base.css";
import "@/admin/styles/shell.css";
import "@/admin/styles/sidebar.css";
import "@/admin/styles/dashboard.css";
import "@/admin/styles/music.css";
import "@/admin/styles/workbench.css";
import "@/admin/styles/profile.css";
import "@/admin/styles/editor.css";
import "@/admin/styles/dialogs.css";
import "@/admin/styles/assets.css";
import "@/admin/styles/social.css";
import "@/admin/styles/gallery.css";
import "@/admin/styles/settings.css";
import "@/admin/styles/hero.css";
import "@/admin/styles/audition.css";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = error ? undefined : data?.claims?.sub;

  if (!userId) redirect("/login?redirect=/admin");
  if (!(await isAdmin(supabase, userId))) redirect("/");

  return <AdminShell>{children}</AdminShell>;
}