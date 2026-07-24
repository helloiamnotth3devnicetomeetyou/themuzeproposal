import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginClient from "./LoginClient";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = { robots: { index: false, follow: false } };

function safeRedirect(value: string | string[] | undefined) {
  const target = Array.isArray(value) ? value[0] : value;
  return target?.startsWith("/") && !target.startsWith("//") ? target : "/";
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string | string[] }> }) {
  const params = await searchParams;
  const redirectTo = safeRedirect(params.redirect);
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect(redirectTo);

  return <LoginClient redirectTo={redirectTo} />;
}