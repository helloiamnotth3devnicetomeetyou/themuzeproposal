import type { Metadata } from "next";
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

  let profileName = "";
  let businessAssets = { pressKitUrl: "", profilePdfUrl: "" };
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .maybeSingle();
    profileName = profile?.name || user.user_metadata?.name || "";
  }

  const { data: businessRow } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "business_assets")
    .maybeSingle();
  if (businessRow?.value && typeof businessRow.value === "object") {
    businessAssets = { ...businessAssets, ...(businessRow.value as Partial<typeof businessAssets>) };
  }

  return (
    <ContactClient
      initialName={profileName}
      initialEmail={user?.email || ""}
      initialUserId={user?.id || null}
      businessAssets={businessAssets}
    />
  );
}
