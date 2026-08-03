import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/core/auth/admin-auth";
import { isSameOriginRequest } from "@/core/http/same-origin";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { createServiceRoleClient } from "@/core/supabase/service";

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  }

  if (!(await isAdmin(supabase, user.id))) {
    return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, title, status, start_at, end_at, categories, form_schema, category_forms } = body;

    const adminClient = createServiceRoleClient();
    const client = adminClient ?? supabase;

    const payload = {
      title: (title || "오디션").trim(),
      status: status || "tba",
      start_at: start_at || null,
      end_at: end_at || null,
      categories: categories || [],
      form_schema: form_schema || [],
      category_forms: category_forms || {},
    };

    if (id) {
      const { data, error } = await client
        .from("auditions")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    } else {
      const { data, error } = await client
        .from("auditions")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }
  } catch (err) {
    console.error("[audition session save error]", err);
    return NextResponse.json(
      { code: "SAVE_FAILED", message: err instanceof Error ? err.message : "Save failed" },
      { status: 500 },
    );
  }
}
