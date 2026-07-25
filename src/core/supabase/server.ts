import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicSupabaseConfig } from "@/core/config/public-env";

const { url: supabaseUrl, anonKey: supabaseAnonKey } = getPublicSupabaseConfig();

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always write cookies. proxy.ts refreshes
          // the session before rendering and persists refreshed tokens.
        }
      },
    },
  });
}
