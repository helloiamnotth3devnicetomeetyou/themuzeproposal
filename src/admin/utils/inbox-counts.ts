import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminInboxCounts = {
  auditions: number;
  contacts: number;
  reports: number;
};

export async function getAdminInboxCounts(
  client: SupabaseClient,
): Promise<AdminInboxCounts> {
  const [auditions, contacts, reports] = await Promise.all([
    client
      .from("audition_submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    client
      .from("contact_inquiries")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("status", "pending"),
    client
      .from("protect_reports")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("status", "pending"),
  ]);
  const error = auditions.error || contacts.error || reports.error;
  if (error) throw error;
  return {
    auditions: auditions.count ?? 0,
    contacts: contacts.count ?? 0,
    reports: reports.count ?? 0,
  };
}
