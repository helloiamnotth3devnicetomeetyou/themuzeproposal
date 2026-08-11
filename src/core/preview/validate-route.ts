import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { isAdmin } from "@/core/auth/admin-auth";
import { isPreviewToken, PREVIEW_SESSION_COOKIE } from "@/core/preview/types";
import { createSupabaseServerClient } from "@/core/supabase/server";

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!isPreviewToken(token)) return NextResponse.json({ active: false }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = error ? undefined : data?.claims?.sub;
  const session = (await cookies()).get(PREVIEW_SESSION_COOKIE)?.value;
  if (!userId || session !== `${userId}:${token}` || !(await isAdmin(supabase, userId))) {
    return NextResponse.json({ active: false }, { status: 403 });
  }
  return NextResponse.json({ active: true }, { headers: { "Cache-Control": "no-store" } });
}
