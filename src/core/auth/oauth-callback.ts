import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/core/supabase/server";

function safeRedirect(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function loginErrorRedirect(request: NextRequest, next: string) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", "oauth");
  loginUrl.searchParams.set("redirect", next);
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeRedirect(request.nextUrl.searchParams.get("next"));

  if (!code) return loginErrorRedirect(request, next);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) return loginErrorRedirect(request, next);
  return NextResponse.redirect(new URL(next, request.url));
}
