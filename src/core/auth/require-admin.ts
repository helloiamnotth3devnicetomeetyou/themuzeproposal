import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { isAdmin } from "./admin-auth";

export type AdminDenial = {
  code: "UNAUTHORIZED" | "FORBIDDEN";
  status: 401 | 403;
  /** Underlying auth error text, for diagnostic payloads only. Never the role check. */
  message?: string;
};

export type AdminGate =
  | { denied: AdminDenial; supabase?: undefined; user?: undefined }
  | { denied?: undefined; supabase: SupabaseClient; user: User };

/** Single session + role boundary for admin route handlers. Returns the denial to
 * render rather than a Response, so each route keeps its own header conventions. */
export async function requireAdmin(): Promise<AdminGate> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user)
    return {
      denied: { code: "UNAUTHORIZED", status: 401, message: error?.message },
    };
  if (!(await isAdmin(supabase, user.id)))
    return { denied: { code: "FORBIDDEN", status: 403 } };
  return { supabase, user };
}
