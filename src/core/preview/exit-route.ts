import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const draft = await draftMode();
  draft.disable();
  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
