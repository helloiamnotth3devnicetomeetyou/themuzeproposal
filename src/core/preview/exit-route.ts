import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { isSameOriginRequest } from "@/core/http/same-origin";
import { PREVIEW_SESSION_COOKIE } from "@/core/preview/types";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { code: "INVALID_REQUEST" },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const draft = await draftMode();
  draft.disable();
  const response = NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "private, no-store" } },
  );
  response.cookies.set(PREVIEW_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
