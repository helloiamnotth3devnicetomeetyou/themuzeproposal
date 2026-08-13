import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseConfig } from "@/core/config/public-env";
import { guideSandboxFetch } from "@/core/supabase/guide-sandbox";

const { url: supabaseUrl, anonKey: supabaseAnonKey } =
  getPublicSupabaseConfig();

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: guideSandboxFetch },
});
