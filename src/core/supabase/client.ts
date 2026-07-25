import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseConfig } from "@/core/config/public-env";

const { url: supabaseUrl, anonKey: supabaseAnonKey } = getPublicSupabaseConfig();

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
