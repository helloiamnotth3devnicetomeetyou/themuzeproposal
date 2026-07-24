import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { isAdmin } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import "./admin.css";
import "./admin-special.css";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = error ? undefined : data?.claims?.sub;

  if (!userId) redirect("/login?redirect=/admin");
  if (!(await isAdmin(supabase, userId))) redirect("/");

  return <AdminShell>{children}</AdminShell>;
}