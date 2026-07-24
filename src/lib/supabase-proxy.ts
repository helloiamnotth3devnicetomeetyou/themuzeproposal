import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getPublicSupabaseConfig } from "@/lib/public-env";

const { url: supabaseUrl, anonKey: supabaseAnonKey } = getPublicSupabaseConfig();

function copyResponseState(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  for (const [key, value] of source.headers) {
    if (key.toLowerCase() !== "location" && key.toLowerCase() !== "set-cookie") {
      target.headers.set(key, value);
    }
  }
  return target;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  // getClaims verifies the JWT signature; unlike getSession it does not trust
  // unverified cookie data.
  const { data, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsError ? undefined : data?.claims?.sub;
  if (!userId) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return copyResponseState(response, NextResponse.redirect(loginUrl));
  }

  if (request.nextUrl.pathname.startsWith("/admin") && !(await isAdmin(supabase, userId))) {
    const publicUrl = request.nextUrl.clone();
    publicUrl.pathname = "/";
    publicUrl.search = "";
    return copyResponseState(response, NextResponse.redirect(publicUrl));
  }

  return response;
}
