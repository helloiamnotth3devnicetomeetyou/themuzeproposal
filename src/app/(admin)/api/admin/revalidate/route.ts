import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/core/auth/admin-auth";
import { parseJsonWithinLimit } from "@/core/http/request-body";
import { isSameOriginRequest } from "@/core/http/same-origin";
import { createSupabaseServerClient } from "@/core/supabase/server";

const cacheTag = z.enum([
  "artist-scene-data",
  "public-artist-schedule",
  "public-artist-title",
  "public-discography",
  "public-home-slides",
  "public-member-title",
  "public-navigation-artists",
  "public-notice-title",
  "public-notices",
  "public-site-settings",
]);
const revalidateSchema = z.object({ tags: z.array(cacheTag).min(1).max(8) });
const MAX_BODY_BYTES = 4 * 1024;

function jsonError(code: string, status: number) {
  return Response.json(
    { code },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return jsonError("INVALID_REQUEST", 400);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(supabase, user.id)))
    return jsonError("FORBIDDEN", 403);

  const parsed = revalidateSchema.safeParse(
    await parseJsonWithinLimit(request, MAX_BODY_BYTES).catch(() => null),
  );
  if (!parsed.success) return jsonError("INVALID_TAG", 400);
  parsed.data.tags.forEach((tag) => revalidateTag(tag, { expire: 0 }));
  return Response.json({ revalidated: true });
}
