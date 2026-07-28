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

  const [artistResult, reportResult] = await Promise.all([
    supabase.from("artists").select("id,name,eng_name,name_ko,name_en,name_ja").eq("is_active", true).order("name"),
    supabase
      .from("protect_reports")
      .select("id,artist_id,report_type,title,platform,status,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <ProtectClient
      initialUserEmail={user.email || ""}
      initialArtists={(artistResult.data ?? []) as Artist[]}
      initialReports={(reportResult.data ?? []) as MyReport[]}
      initialLoadFailed={Boolean(artistResult.error || reportResult.error)}
    />
  );
}
