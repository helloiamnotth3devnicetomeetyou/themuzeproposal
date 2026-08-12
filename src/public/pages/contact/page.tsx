import type { Metadata } from "next";
import { DAILY_SUBMISSION_LIMIT, getSubmissionRemaining } from "@/core/http/submission-rate-limit";
import { safeHref } from "@/core/http/safe-href";
import { createPageMetadata } from "@/core/seo/metadata";
import { createSupabaseServerClient } from "@/core/supabase/server";
import ContactClient from "./ContactClient";

export const metadata: Metadata = createPageMetadata(
  "Contact",
  "THE MUZE 일반 문의 및 비즈니스 제안 접수",
);

export default async function ContactPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let businessAssets = { pressKitUrl: "", profilePdfUrl: "" };
  const [profileResult, businessRowResult, remaining] = await Promise.all([
    user
      ? supabase.from("profiles").select("name,avatar_asset_id").eq("id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("site_settings").select("value").eq("key", "business_assets").maybeSingle(),
    user ? getSubmissionRemaining("contact_inquiry", user.id) : Promise.resolve(DAILY_SUBMISSION_LIMIT),
  ]);
  const profile = profileResult.data;
  const businessRow = businessRowResult.data;
  const { data: avatar } = profile?.avatar_asset_id
    ? await supabase.from("avatar_assets").select("image_path").eq("id", profile.avatar_asset_id).eq("is_active", true).maybeSingle()
    : { data: null };
  const avatarUrl = avatar?.image_path ? supabase.storage.from("artist-assets").getPublicUrl(avatar.image_path).data.publicUrl : "";
  if (businessRow?.value && typeof businessRow.value === "object") {
    const assets = businessRow.value as Partial<typeof businessAssets>;
    businessAssets = {
      pressKitUrl: safeHref(assets.pressKitUrl) ?? "",
      profilePdfUrl: safeHref(assets.profilePdfUrl) ?? "",
    };
  }

  return (
    <ContactClient
      isAuthenticated={Boolean(user)}
      initialName={profile?.name || user?.user_metadata?.name || ""}
      initialEmail={user?.email || ""}
      initialAvatarUrl={avatarUrl}
      initialRemaining={remaining}
      businessAssets={businessAssets}
    />
  );
}
