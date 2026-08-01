import { revalidateTag } from "next/cache";
import { isAdmin } from "@/core/auth/admin-auth";
import { createSupabaseServerClient } from "@/core/supabase/server";

const ALLOWED_TAGS = new Set(["public-home-slides", "public-notices"]);

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(supabase, user.id))) return Response.json({ error: "forbidden" }, { status: 403 });

  const { tag } = await request.json().catch(() => ({}));
  if (typeof tag !== "string" || !ALLOWED_TAGS.has(tag)) return Response.json({ error: "invalid tag" }, { status: 400 });
  revalidateTag(tag, "max");
  return Response.json({ revalidated: true });
}
