import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AccountClient from "./AccountClient";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/account");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <AccountClient
      initialName={profile?.name || user.user_metadata?.name || ""}
      initialEmail={user.email || ""}
    />
  );
}