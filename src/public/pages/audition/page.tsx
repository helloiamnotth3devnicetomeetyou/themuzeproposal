import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { getSubmissionRemaining } from "@/core/http/submission-rate-limit";
import { getPublicAssetUrl } from "@/core/storage/public-url";
import type { AuditionCampaign, AuditionFormField, AuditionSubmission } from "@/core/auditions/types";
import AuditionClient from "./AuditionClient";

export default async function AuditionPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/audition");

  const [campaignResult, fieldResult, submissionResult, profileResult, remaining] = await Promise.all([
    supabase.from("audition_campaigns").select("*").order("starts_at", { ascending: false }),
    supabase.from("audition_form_fields").select("*").eq("is_active", true).order("sort_order"),
    supabase.rpc("get_my_audition_submissions"),
    supabase.from("profiles").select("name,avatar_asset_id").eq("id", user.id).maybeSingle(),
    getSubmissionRemaining("audition_submission", user.id),
  ]);
  const { data: avatar } = profileResult.data?.avatar_asset_id
    ? await supabase.from("avatar_assets").select("image_path").eq("id", profileResult.data.avatar_asset_id).eq("is_active", true).maybeSingle()
    : { data: null };
  const avatarUrl = avatar?.image_path ? getPublicAssetUrl("artist-assets", avatar.image_path) : "";

  return <AuditionClient
    userEmail={user.email || ""}
    userName={profileResult.data?.name || user.user_metadata?.name || ""}
    avatarUrl={avatarUrl}
    initialRemaining={remaining}
    initialCampaigns={(campaignResult.data ?? []) as AuditionCampaign[]}
    initialFields={(fieldResult.data ?? []) as AuditionFormField[]}
    initialSubmissions={(submissionResult.data ?? []) as AuditionSubmission[]}
    initialLoadFailed={Boolean(campaignResult.error || fieldResult.error || submissionResult.error)}
  />;
}
