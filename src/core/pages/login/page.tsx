import { redirect } from "next/navigation";
import LoginClient from "./LoginClient";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { createPrivatePageMetadata } from "@/core/seo/metadata";
import { safeRedirect } from "@/core/utils/redirect";

export const metadata = createPrivatePageMetadata("Login");

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    redirect?: string | string[];
    error?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const redirectTo = safeRedirect(params.redirect);
  const authError = Array.isArray(params.error) ? params.error[0] : params.error;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect(redirectTo);

  return <LoginClient redirectTo={redirectTo} oauthFailed={authError === "oauth"} />;
}
