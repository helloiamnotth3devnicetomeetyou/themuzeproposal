import { NextResponse, NextRequest } from "next/server";
import { updateSession } from "@/core/supabase/proxy";

export async function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const isDev = process.env.NODE_ENV === "development";
  const vercelToolbar =
    process.env.VERCEL_ENV === "preview" ? " https://vercel.live" : "";
  const cspHeader = isDev
    ? undefined
    : `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; frame-src 'self' https://challenges.cloudflare.com${vercelToolbar}; img-src 'self' data: blob: https:; media-src 'self' blob: https:; font-src 'self' data: https:; style-src 'self'${vercelToolbar}; style-src-attr 'unsafe-inline'; script-src 'self' 'nonce-${nonce}' https://challenges.cloudflare.com${vercelToolbar}; connect-src 'self' https:${vercelToolbar ? " wss://ws-us3.pusher.com" : ""}; form-action 'self'`;

  const pathname = request.nextUrl.pathname;
  const isAuthRoute =
    pathname.startsWith("/admin") ||
    pathname === "/account" ||
    pathname === "/protect";

  const requestHeaders = new Headers(request.headers);
  if (cspHeader) {
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", cspHeader);
  }

  const modifiedRequest = new NextRequest(request, {
    headers: requestHeaders,
  });

  let response: NextResponse;
  if (isAuthRoute) {
    response = await updateSession(modifiedRequest);
  } else {
    response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  if (cspHeader) response.headers.set("Content-Security-Policy", cspHeader);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|images).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
