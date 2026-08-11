import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/core/auth/admin-auth";
import { isSameOriginRequest } from "@/core/http/same-origin";
import { createSupabaseServerClient } from "@/core/supabase/server";

const revalidateSchema = z.object({ tag: z.enum(["public-notices", "public-navigation-artists", "public-site-settings", "public-home-slides", "artist-scene-data"]) });

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "invalid request" }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(supabase, user.id))) return Response.json({ error: "forbidden" }, { status: 403 });

  const parsed = revalidateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid tag" }, { status: 400 });
  const { tag } = parsed.data;
  revalidateTag(tag, "max");
  return Response.json({ revalidated: true });
}
