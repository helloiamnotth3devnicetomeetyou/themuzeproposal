import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseConfig } from "./public-env";

const { url: supabaseUrl, anonKey: supabaseAnonKey } = getPublicSupabaseConfig();

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
