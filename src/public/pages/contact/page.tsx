import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSubmissionRemaining } from "@/core/http/submission-rate-limit";
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
  if (!user) redirect("/login?redirect=/contact");

  let businessAssets = { pressKitUrl: "", profilePdfUrl: "" };
  const [{ data: profile }, { data: businessRow }, remaining] = await Promise.all([
    supabase.from("profiles").select("name,avatar_asset_id").eq("id", user.id).maybeSingle(),
    supabase.from("site_settings").select("value").eq("key", "business_assets").maybeSingle(),
    getSubmissionRemaining("contact_inquiry", user.id),
  ]);
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
      initialName={profile?.name || user.user_metadata?.name || ""}
      initialEmail={user.email || ""}
      initialAvatarUrl={avatarUrl}
      initialRemaining={remaining}
      businessAssets={businessAssets}
    />
  );
}
