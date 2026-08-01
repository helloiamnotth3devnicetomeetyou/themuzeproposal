import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { isSameOriginRequest } from "@/core/http/same-origin";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { code: "INVALID_REQUEST" },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const draft = await draftMode();
  draft.disable();
  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
