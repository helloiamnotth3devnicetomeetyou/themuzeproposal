import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminShell from "@/admin/components/shell/AdminShell";
import { isAdmin } from "@/core/auth/admin-auth";
import { createSupabaseServerClient } from "@/core/supabase/server";
import "@/styles/(admin)/base.css";
import "@/styles/(admin)/shell.css";
import "@/styles/(admin)/sidebar-layout.css";
import "@/styles/(admin)/sidebar-commands.css";
import "@/styles/(admin)/dashboard.css";
import "@/styles/(admin)/music.css";
import "@/styles/(admin)/workbench.css";
import "@/styles/(admin)/profile.css";
import "@/styles/(admin)/editor.css";
import "@/styles/(admin)/dialogs.css";
import "@/styles/(admin)/onboarding.css";
import "@/styles/(admin)/assets.css";
import "@/styles/(admin)/social.css";
import "@/styles/(admin)/gallery.css";
import "@/styles/(admin)/settings.css";
import "@/styles/(admin)/hero.css";
import "@/styles/(admin)/audition.css";
import "@/styles/(admin)/responsive-base.css";
import "@/styles/(admin)/responsive-polish.css";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = error ? undefined : data?.claims?.sub;

  if (!userId) redirect("/login?redirect=/admin");
  if (!(await isAdmin(supabase, userId))) redirect("/");

  return <AdminShell>{children}</AdminShell>;
}
