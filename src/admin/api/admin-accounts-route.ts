import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isSuperAdmin, type AdminRole } from "@/core/auth/admin-auth";
import { parseJsonWithinLimit } from "@/core/http/request-body";
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
const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  role: adminRoleSchema,
});
const roleChangeSchema = z.object({
  id: z.string().uuid(),
  role: adminRoleSchema,
});
const removeSchema = z.object({ id: z.string().uuid() });
const MAX_BODY_BYTES = 4 * 1024;

function response(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

async function requireSuperAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { error: response({ code: "UNAUTHORIZED" }, 401) };
  if (!(await isSuperAdmin(supabase, user.id)))
    return { error: response({ code: "FORBIDDEN" }, 403) };
  return { user, supabase };
}

async function changeAdminRole(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  targetId: string,
  role: AdminRole | null,
) {
  const { error } = await supabase.rpc("set_admin_role", {
    p_target_id: targetId,
    p_role: role,
  });
  if (!error) return null;
  return (
    ["CANNOT_CHANGE_OWN_ROLE", "NOT_FOUND", "LAST_SUPER_ADMIN"].find((code) =>
      error.message.includes(code),
    ) ?? "SERVICE_UNAVAILABLE"
  );
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
  if (!isSameOriginRequest(request))
    return response({ code: "INVALID_REQUEST" }, 400);
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const parsed = inviteSchema.safeParse(
    await parseJsonWithinLimit(request, MAX_BODY_BYTES).catch(() => null),
  );
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
    const changeError = await changeAdminRole(auth.supabase, existing.id, role);
    if (changeError)
      return response(
        { code: changeError },
        changeError === "NOT_FOUND"
          ? 404
          : changeError === "SERVICE_UNAVAILABLE"
            ? 503
            : 409,
      );
    return response({ invited: false });
  }

  const { data: invitation, error: inviteError } =
    await adminClient.auth.admin.inviteUserByEmail(email);
  if (inviteError || !invitation.user)
    return response({ code: "INVITATION_FAILED" }, 422);

  const changeError = await changeAdminRole(
    auth.supabase,
    invitation.user.id,
    role,
  );
  if (changeError) {
    await adminClient.auth.admin.deleteUser(invitation.user.id);
    return response({ code: "INVITATION_FAILED" }, 422);
  }

  return response({ invited: true }, 201);
}

export async function PATCH(request: NextRequest) {
  if (!isSameOriginRequest(request))
    return response({ code: "INVALID_REQUEST" }, 400);
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const parsed = roleChangeSchema.safeParse(
    await parseJsonWithinLimit(request, MAX_BODY_BYTES).catch(() => null),
  );
  if (!parsed.success) return response({ code: "INVALID_REQUEST" }, 400);
  const { id, role } = parsed.data;

  const changeError = await changeAdminRole(auth.supabase, id, role);
  if (changeError)
    return response(
      { code: changeError },
      changeError === "NOT_FOUND"
        ? 404
        : changeError === "SERVICE_UNAVAILABLE"
          ? 503
          : 409,
    );
  return response({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request))
    return response({ code: "INVALID_REQUEST" }, 400);
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const parsed = removeSchema.safeParse(
    await parseJsonWithinLimit(request, MAX_BODY_BYTES).catch(() => null),
  );
  if (!parsed.success) return response({ code: "INVALID_REQUEST" }, 400);
  const { id } = parsed.data;

  const changeError = await changeAdminRole(auth.supabase, id, null);
  if (changeError)
    return response(
      { code: changeError },
      changeError === "NOT_FOUND"
        ? 404
        : changeError === "SERVICE_UNAVAILABLE"
          ? 503
          : 409,
    );
  return response({ ok: true });
}
