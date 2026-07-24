import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export async function isAdmin(client: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await client
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  return !error && data?.is_admin === true;
}
