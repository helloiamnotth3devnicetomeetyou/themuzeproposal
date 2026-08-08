import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isSuperAdmin, type AdminRole } from "@/core/auth/admin-auth";
import { isSameOriginRequest } from "@/core/http/same-origin";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { createServiceRoleClient } from "@/core/supabase/service";

type AdminAccount = {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
  created_at: string | null;
  updated_at: string | null;
};

const adminRoleSchema = z.enum(["super_admin", "editor"]);
const inviteSchema = z.object({ email: z.string().trim().toLowerCase().email().max(254), role: adminRoleSchema });
const roleChangeSchema = z.object({ id: z.string().uuid(), role: adminRoleSchema });
const removeSchema = z.object({ id: z.string().uuid() });

function response(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function requireSuperAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: response({ code: "UNAUTHORIZED" }, 401) };
  if (!(await isSuperAdmin(supabase, user.id))) return { error: response({ code: "FORBIDDEN" }, 403) };
  return { user, supabase };
}

async function preventUnsafeRoleChange(
  adminClient: NonNullable<ReturnType<typeof createServiceRoleClient>>,
  actorId: string,
  targetId: string,
  nextRole: AdminRole | null,
) {
  if (actorId === targetId) return "CANNOT_CHANGE_OWN_ROLE";

  const { data: target, error: targetError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", targetId)
    .maybeSingle();
  if (targetError || !target) return "NOT_FOUND";

  if (target.role === "super_admin" && nextRole !== "super_admin") {
    const { count, error: countError } = await adminClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "super_admin");
    if (countError) return "SERVICE_UNAVAILABLE";
    if ((count ?? 0) <= 1) return "LAST_SUPER_ADMIN";
  }

  return null;
}

export async function GET() {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const adminClient = createServiceRoleClient();
  if (!adminClient) return response({ code: "SERVICE_UNAVAILABLE" }, 503);

  const { data, error } = await adminClient
    .from("profiles")
    .select("id,email,name,role,created_at,updated_at")
    .in("role", ["super_admin", "editor"])
    .order("role", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return response({ code: "SERVICE_UNAVAILABLE" }, 503);

  return response({ accounts: (data ?? []) as AdminAccount[] });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return response({ code: "INVALID_REQUEST" }, 400);
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const parsed = inviteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return response({ code: "INVALID_REQUEST" }, 400);
  const { email, role } = parsed.data;

  const adminClient = createServiceRoleClient();
  if (!adminClient) return response({ code: "SERVICE_UNAVAILABLE" }, 503);

  const { data: existing, error: lookupError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (lookupError) return response({ code: "SERVICE_UNAVAILABLE" }, 503);

  if (existing) {
    const unsafeChange = await preventUnsafeRoleChange(adminClient, auth.user.id, existing.id, role);
    if (unsafeChange) return response({ code: unsafeChange }, unsafeChange === "NOT_FOUND" ? 404 : 409);
    const { error } = await auth.supabase.from("profiles").update({ role }).eq("id", existing.id);
    if (error) return response({ code: "SERVICE_UNAVAILABLE" }, 503);
    return response({ invited: false });
  }

  const { data: invitation, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email);
  if (inviteError || !invitation.user) return response({ code: "INVITATION_FAILED" }, 422);

  const { error: roleError } = await auth.supabase
    .from("profiles")
    .upsert({ id: invitation.user.id, email, role }, { onConflict: "id" });
  if (roleError) return response({ code: "INVITATION_FAILED" }, 422);

  return response({ invited: true }, 201);
}

export async function PATCH(request: NextRequest) {
  if (!isSameOriginRequest(request)) return response({ code: "INVALID_REQUEST" }, 400);
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const parsed = roleChangeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return response({ code: "INVALID_REQUEST" }, 400);
  const { id, role } = parsed.data;

  const adminClient = createServiceRoleClient();
  if (!adminClient) return response({ code: "SERVICE_UNAVAILABLE" }, 503);
  const unsafeChange = await preventUnsafeRoleChange(adminClient, auth.user.id, id, role);
  if (unsafeChange) return response({ code: unsafeChange }, unsafeChange === "NOT_FOUND" ? 404 : 409);

  const { error } = await auth.supabase.from("profiles").update({ role }).eq("id", id);
  if (error) return response({ code: "SERVICE_UNAVAILABLE" }, 503);
  return response({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) return response({ code: "INVALID_REQUEST" }, 400);
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const parsed = removeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return response({ code: "INVALID_REQUEST" }, 400);
  const { id } = parsed.data;

  const adminClient = createServiceRoleClient();
  if (!adminClient) return response({ code: "SERVICE_UNAVAILABLE" }, 503);
  const unsafeChange = await preventUnsafeRoleChange(adminClient, auth.user.id, id, null);
  if (unsafeChange) return response({ code: unsafeChange }, unsafeChange === "NOT_FOUND" ? 404 : 409);

  const { error } = await auth.supabase.from("profiles").update({ role: null }).eq("id", id);
  if (error) return response({ code: "SERVICE_UNAVAILABLE" }, 503);
  return response({ ok: true });
}
