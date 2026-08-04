import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/core/supabase/server";
import type { AuditionCampaign, AuditionFormField, AuditionSubmission } from "@/core/auditions/types";
import AuditionClient from "./AuditionClient";

export default async function AuditionPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/audition");

  const [campaignResult, fieldResult, submissionResult] = await Promise.all([
    supabase.from("audition_campaigns").select("*").order("starts_at", { ascending: false }),
    supabase.from("audition_form_fields").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("audition_submissions").select("id,campaign_id,user_id,answers,form_snapshot,status,reviewer_notes,reviewed_by,reviewed_at,created_at,updated_at").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  return <AuditionClient
    userEmail={user.email || ""}
    initialCampaigns={(campaignResult.data ?? []) as AuditionCampaign[]}
    initialFields={(fieldResult.data ?? []) as AuditionFormField[]}
    initialSubmissions={(submissionResult.data ?? []) as AuditionSubmission[]}
    initialLoadFailed={Boolean(campaignResult.error || fieldResult.error || submissionResult.error)}
  />;
}
