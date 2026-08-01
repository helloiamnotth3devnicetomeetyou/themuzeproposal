import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { isAdmin } from "@/core/auth/admin-auth";
import { isSameOriginRequest } from "@/core/http/same-origin";
import { createSupabaseServerClient } from "@/core/supabase/server";

const ALLOWED_TAGS = new Set(["public-notices", "public-navigation-artists", "public-site-settings", "artist-scene-data"]);

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "invalid request" }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(supabase, user.id))) return Response.json({ error: "forbidden" }, { status: 403 });

  const { tag } = await request.json().catch(() => ({}));
  if (typeof tag !== "string" || !ALLOWED_TAGS.has(tag)) return Response.json({ error: "invalid tag" }, { status: 400 });
  revalidateTag(tag, "max");
  return Response.json({ revalidated: true });
}
