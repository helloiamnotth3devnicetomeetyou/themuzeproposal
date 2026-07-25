import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { isAdmin } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import "./styles/base.css";
import "./styles/shell.css";
import "./styles/sidebar.css";
import "./styles/dashboard.css";
import "./styles/music.css";
import "./styles/workbench.css";
import "./styles/profile.css";
import "./styles/editor.css";
import "./styles/dialogs.css";
import "./styles/assets.css";
import "./styles/social.css";
import "./styles/gallery.css";
import "./styles/settings.css";
import "./styles/hero.css";
import "./styles/audition.css";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = error ? undefined : data?.claims?.sub;

  if (!userId) redirect("/login?redirect=/admin");
  if (!(await isAdmin(supabase, userId))) redirect("/");

  return <AdminShell>{children}</AdminShell>;
}