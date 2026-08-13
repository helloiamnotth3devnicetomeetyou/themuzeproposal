import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminRole = "super_admin" | "editor";

export async function getAdminRole(
  client: SupabaseClient,
  userId: string,
): Promise<AdminRole | null> {
  const { data, error } = await client
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error || (data?.role !== "super_admin" && data?.role !== "editor"))
    return null;
  return data.role;
}

export async function isAdmin(
  client: SupabaseClient,
  userId: string,
): Promise<boolean> {
  return (await getAdminRole(client, userId)) !== null;
}

export async function isSuperAdmin(
  client: SupabaseClient,
  userId: string,
): Promise<boolean> {
  return (await getAdminRole(client, userId)) === "super_admin";
}
