import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ProtectClient, { type Artist, type MyReport } from "./ProtectClient";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { createPrivatePageMetadata } from "@/core/seo/metadata";

export const metadata: Metadata = createPrivatePageMetadata("Protect Reports");

export default async function ProtectPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/protect");

  const [artistResult, reportResult, profileResult] = await Promise.all([
    supabase.from("artists").select("id,name,eng_name,name_ko,name_en,name_ja").eq("is_active", true).order("name"),
    supabase
      .from("protect_reports")
      .select("id,artist_id,report_type,title,platform,status,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("name").eq("id", user.id).maybeSingle(),
  ]);

  return (
    <ProtectClient
      initialUserEmail={user.email || ""}
      initialUserName={profileResult.data?.name || user.user_metadata?.name || ""}
      initialArtists={(artistResult.data ?? []) as Artist[]}
      initialReports={(reportResult.data ?? []) as MyReport[]}
      initialLoadFailed={Boolean(artistResult.error || reportResult.error)}
    />
  );
}
